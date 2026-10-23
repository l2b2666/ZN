"""Run against an isolated instance: ZN_TEST_URL=http://127.0.0.1:3001 DATA_DIR=/tmp/zn-e2e-data python tests/browser-smoke.py.
Requires Python Playwright and a Chromium installation. This creates test accounts and an operator in the selected database.
"""
import os
import re
import secrets
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

base=os.environ.get('ZN_TEST_URL','http://127.0.0.1:3001')
root=Path(__file__).resolve().parent.parent
email=f'e2e-{secrets.token_hex(4)}@example.test'
password=secrets.token_urlsafe(20)
admin_email=f'operator-{secrets.token_hex(4)}@example.test'
admin_password=secrets.token_urlsafe(20)
subprocess.run(['node','server/admin.js'],cwd=root,env={**os.environ,'ADMIN_EMAIL':admin_email,'ADMIN_PASSWORD':admin_password},check=True,capture_output=True)

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
    context=browser.new_context(viewport={'width':1440,'height':1000})
    page=context.new_page()
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.goto(base,wait_until='networkidle')
    expect(page.locator('h1')).to_contain_text('Dzień dobry, Anno')
    assert page.locator('.hero img').evaluate('(i)=>i.complete && i.naturalWidth>0')
    page.get_by_role('button',name='Zobacz raport',exact=True).click()
    dialog=page.locator('dialog')
    expect(dialog).to_be_visible()
    expect(dialog.locator('.detail-photo')).to_have_count(2)
    dialog.locator('.detail-photo>button').first.click()
    expect(dialog.locator('.lightbox')).to_be_visible()
    with page.expect_download() as download:
        dialog.locator('.lightbox').get_by_role('button',name='Pobierz zdjęcie').click()
    assert download.value.failure() is None
    page.get_by_role('button',name='Zamknij powiększone zdjęcie').click()
    page.get_by_role('button',name='Zamknij okno',exact=True).click()
    print('PASS: dashboard, report, lightbox, authenticated image download')

    page.locator('.demo-tag').click()
    dialog=page.locator('dialog')
    dialog.get_by_label('Imię i nazwisko').fill('Ewa Testowa')
    dialog.get_by_label('Adres e-mail').fill(email)
    dialog.locator('input[name=password]').fill(password)
    dialog.get_by_role('button',name='Załóż bezpłatne konto').click()
    expect(page.locator('h1')).to_contain_text('Ewo')
    expect(page.locator('.demo-tag')).to_have_count(0)
    page.get_by_role('button',name='Zamów usługę',exact=True).first.click()
    dialog=page.locator('dialog')
    dialog.get_by_role('button',name='Dalej',exact=True).click()
    dialog.get_by_label('Imię i nazwisko osoby').fill('Jan Testowy')
    dialog.get_by_label('Nazwa cmentarza').fill('Cmentarz Testowy')
    dialog.get_by_label('Miejscowość').fill('Warszawa')
    dialog.get_by_label('Kwatera / sektor').fill('Kwatera 12')
    dialog.get_by_label('Rząd i numer grobu').fill('Rząd 3, grób 2')
    dialog.get_by_role('button',name='Dalej',exact=True).click()
    dialog.get_by_label('Dodatkowy znicz').check()
    dialog.get_by_label('Uwagi dla opiekuna').fill('Proszę postawić znicz po prawej stronie.')
    expect(dialog.locator('.summary-total')).to_contain_text('264')
    dialog.get_by_role('button',name='Zamów usługę',exact=True).click()
    expect(page.locator('h1')).to_have_text('Moje zamówienia')
    expect(page.locator('.order-row')).to_have_count(1)
    expect(page.locator('.order-row')).to_contain_text('Zaplanowane')
    print('PASS: registration, new grave, 3-step order, extras and server-calculated total')

    operator=browser.new_context(viewport={'width':1440,'height':1000})
    staff=operator.new_page()
    staff.goto(base,wait_until='networkidle')
    staff.locator('.demo-tag').click()
    staff.get_by_role('button',name='Zaloguj się',exact=True).first.click()
    staff.locator('dialog').get_by_label('Adres e-mail').fill(admin_email)
    staff.locator('dialog').locator('input[name=password]').fill(admin_password)
    staff.locator('dialog form').get_by_role('button',name='Zaloguj się',exact=True).click()
    staff.get_by_role('button',name='Obsługa zamówień',exact=True).click()
    expect(staff.locator('.order-row')).to_have_count(1)
    staff.get_by_role('button',name='Obsłuż',exact=False).click()
    staff.locator('dialog select').select_option('completed')
    staff.locator('dialog textarea').fill('Umyto płytę nagrobka, uporządkowano otoczenie i zapalono znicz.')
    staff.locator('dialog input[type=file]').nth(1).set_input_files(str(root/'public/images/grave.jpg'))
    staff.get_by_role('button',name='Zapisz i powiadom klienta').click()
    expect(staff.locator('dialog')).to_have_count(0)
    expect(staff.locator('.order-row .badge')).to_have_text('Zrealizowane')
    page.reload(wait_until='networkidle')
    expect(page.locator('.order-row .badge')).to_have_text('Zrealizowane')
    page.get_by_role('button',name='Zobacz raport',exact=True).click()
    expect(page.locator('.caretaker-note')).to_contain_text('zapalono znicz')
    expect(page.locator('.detail-photo img')).to_have_count(1)
    assert page.locator('.detail-photo img').evaluate('(i)=>i.complete && i.naturalWidth>0')
    page.get_by_role('button',name='Zamknij okno',exact=True).click()
    page.get_by_role('button',name=re.compile('Powiadomienia')).click()
    expect(page.locator('.notifications')).to_contain_text('Twój nagrobek jest już zadbany')
    page.locator('.popover-away').click(position={'x':10,'y':10})
    print('PASS: operator login, completion with uploaded photo, client report and notification')

    for width in [360,390,768,1024,1440]:
        page.set_viewport_size({'width':width,'height':900})
        for route in ['dashboard','orders','graves','reports','help']:
            page.goto(base+'/#'+route,wait_until='networkidle')
            page.wait_for_timeout(300)
            assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'), f'Overflow {width} {route}'
    page.set_viewport_size({'width':390,'height':844})
    page.goto(base+'/#dashboard',wait_until='networkidle')
    page.wait_for_timeout(350)
    page.get_by_role('button',name='Otwórz menu').click()
    page.get_by_role('button',name='Moje nagrobki',exact=True).click()
    expect(page.locator('h1')).to_have_text('Moje nagrobki')
    page.get_by_role('button',name='Dodaj nagrobek',exact=True).click()
    expect(page.locator('dialog')).to_be_visible()
    assert not page.locator('dialog').evaluate('(d)=>d.scrollWidth>d.clientWidth')
    page.keyboard.press('Escape')
    expect(page.locator('dialog')).to_have_count(0)
    assert not errors, errors
    print('PASS: all pages at 5 viewport widths, mobile navigation, modal and keyboard close; no browser errors')
    browser.close()
