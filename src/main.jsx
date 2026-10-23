import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  Sprout,
  LayoutDashboard,
  ClipboardList,
  Landmark,
  Images,
  CircleHelp,
  Bell,
  ChevronDown,
  ArrowUpRight,
  Plus,
  ArrowRight,
  MapPin,
  CalendarDays,
  Check,
  CheckCheck,
  Clock3,
  CircleCheck,
  X,
  Search,
  Menu,
  LogOut,
  UserRound,
  ShieldCheck,
  LoaderCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  Phone,
  Heart,
  Sparkles,
  Camera,
  Settings2,
  ImagePlus,
  Leaf,
  Flower2,
  Flame,
  FileText,
  Info,
  Send,
  Play,
  Eye,
  EyeOff,
} from "lucide-react";
import "@fontsource/dm-sans/latin-ext-400.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-ext-500.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-ext-600.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/manrope/latin-ext-400.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-ext-500.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-ext-600.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-ext-700.css";
import "@fontsource/manrope/latin-700.css";
import "./styles.css";

const navigation = [
  ["dashboard", "Pulpit", LayoutDashboard],
  ["orders", "Moje zamówienia", ClipboardList],
  ["graves", "Moje nagrobki", Landmark],
  ["reports", "Zdjęcia i raporty", Images],
];
const statusLabels = {
  scheduled: "Zaplanowane",
  in_progress: "W realizacji",
  completed: "Zrealizowane",
  cancelled: "Anulowane",
};
const date = (value, opts = {}) =>
  new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    ...opts,
  }).format(new Date(value));
const price = (value) =>
  new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(value);
const today = () => new Date().toISOString().slice(0, 10);
const initials = (name) =>
  name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");
const greeting = (name) =>
  ({
    Anna: "Anno",
    Ewa: "Ewo",
    Paweł: "Pawle",
    Barbara: "Barbaro",
    Maria: "Mario",
    Zofia: "Zofio",
    Jan: "Janie",
    Piotr: "Piotrze",
    Katarzyna: "Katarzyno",
    Agnieszka: "Agnieszko",
    Michał: "Michale",
    Tomasz: "Tomaszu",
  })[name.split(" ")[0]] || name.split(" ")[0];
async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
    body:
      options.body instanceof FormData
        ? options.body
        : options.body
          ? JSON.stringify(options.body)
          : undefined,
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Nie udało się połączyć z serwerem.");
  return data;
}
function Button({
  children,
  variant = "",
  className = "",
  loading = false,
  disabled = false,
  ...props
}) {
  return (
    <button
      className={`btn ${variant} ${className}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? <LoaderCircle size={17} className="spin" /> : null}
      {children}
    </button>
  );
}
function Badge({ status }) {
  return (
    <span className={`badge ${status}`}>
      <span />
      {statusLabels[status]}
    </span>
  );
}
function Empty({ icon: Icon = Leaf, title, description, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon size={30} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
function Modal({ title, subtitle, onClose, children, wide = false }) {
  const ref = useRef();
  useEffect(() => {
    const el = ref.current;
    el.showModal();
    const close = (e) => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener("cancel", close);
    return () => el.removeEventListener("cancel", close);
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      onClick={(e) => {
        if (e.target === ref.current) {
          const r = ref.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Zamknij okno"
        >
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function Field({ label, children, hint }) {
  const id = React.useId();
  const bind = (nodes) =>
    React.Children.map(nodes, (child) => {
      if (!React.isValidElement(child)) return child;
      if (["input", "select", "textarea"].includes(child.type))
        return React.cloneElement(child, {
          id,
          "aria-describedby": hint ? `${id}-hint` : undefined,
        });
      return child.props.children
        ? React.cloneElement(child, {}, bind(child.props.children))
        : child;
    });
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {bind(children)}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}
function ErrorMessage({ error }) {
  return error ? (
    <div className="form-error" role="alert">
      <Info size={17} />
      {error}
    </div>
  ) : null;
}

function App() {
  const [data, setData] = useState(null),
    [failure, setFailure] = useState(""),
    [page, setPage] = useState(location.hash.slice(1) || "dashboard"),
    [modal, setModal] = useState(null),
    [mobile, setMobile] = useState(false),
    [notices, setNotices] = useState(false),
    [accountMenu, setAccountMenu] = useState(false),
    [toast, setToast] = useState("");
  async function load() {
    try {
      setData(await api("/bootstrap"));
      setFailure("");
    } catch (e) {
      setFailure(e.message);
    }
  }
  useEffect(() => {
    load();
    const poll = setInterval(load, 30000);
    return () => clearInterval(poll);
  }, []);
  useEffect(() => {
    const change = () => setPage(location.hash.slice(1) || "dashboard");
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  const go = (p) => {
    location.hash = p;
    setPage(p);
    setMobile(false);
    setNotices(false);
    setAccountMenu(false);
  };
  const notify = (msg) => setToast(msg);
  const refresh = async () => {
    await load();
  };
  const openOrder = (grave) => setModal({ type: "order", grave });
  const openReport = (order) => setModal({ type: "report", order });
  if (!data)
    return (
      <div className="boot">
        <div className="brand-symbol">
          <Sprout size={30} />
        </div>
        <h2>
          ZadbanyNagrobek<span>.pl</span>
        </h2>
        {failure ? (
          <>
            <p>{failure}</p>
            <Button onClick={load}>Spróbuj ponownie</Button>
          </>
        ) : (
          <>
            <LoaderCircle className="spin" />
            <p>Przygotowujemy Twoją przestrzeń…</p>
          </>
        )}
      </div>
    );
  if (!data.user) return <Welcome onSuccess={refresh} />;
  const unread = data.notifications.filter((n) => !n.read).length;
  const active = data.orders.filter((o) =>
    ["scheduled", "in_progress"].includes(o.status),
  );
  const completed = data.orders.filter((o) => o.status === "completed");
  const openNotice = async (n) => {
    const order = data.orders.find((o) => o.id === n.order_id);
    setNotices(false);
    await api("/notifications/read", { method: "POST" });
    refresh();
    if (order) openReport(order);
  };
  return (
    <div className="app-shell">
      {mobile && (
        <div className="mobile-overlay" onClick={() => setMobile(false)} />
      )}
      <aside className={`sidebar ${mobile ? "is-open" : ""}`}>
        <a className="brand" href="#dashboard" onClick={() => go("dashboard")}>
          <span className="brand-symbol">
            <Sprout size={28} strokeWidth={1.65} />
          </span>
          <span>
            ZadbanyNagrobek<span className="brand-pl">.pl</span>
            <small>Z TROSKĄ O PAMIĘĆ</small>
          </span>
        </a>
        <div className="sidebar-label">PANEL KLIENTA</div>
        <nav aria-label="Główna nawigacja">
          {navigation.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => go(id)}
              className={`nav-item ${page === id ? "active" : ""}`}
            >
              <Icon size={20} strokeWidth={1.65} />
              <span>{label}</span>
              {id === "orders" && active.length > 0 && (
                <span className="nav-count">{active.length}</span>
              )}
            </button>
          ))}
          {data.user.role === "admin" && (
            <button
              className={`nav-item ${page === "admin" ? "active" : ""}`}
              onClick={() => go("admin")}
            >
              <Settings2 size={20} />
              Obsługa zamówień
            </button>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <div className="note-leaf">
              <Heart size={20} strokeWidth={1.5} />
            </div>
            <h4>Jesteśmy blisko.</h4>
            <p>
              Gdy Ty nie możesz być
              <br />
              na miejscu, my zadbamy
              <br />o to, co ważne.
            </p>
            <button onClick={() => go("help")}>
              Jak możemy pomóc? <ArrowUpRight size={15} />
            </button>
            <Sprout className="note-decoration" size={84} strokeWidth={0.8} />
          </div>
          <button
            className={`nav-item help-nav ${page === "help" ? "active" : ""}`}
            onClick={() => go("help")}
          >
            <CircleHelp size={20} strokeWidth={1.65} />
            Pomoc i kontakt
          </button>
          <div className="sidebar-user">
            <span className="avatar">{initials(data.user.name)}</span>
            <div>
              <strong>{data.user.name}</strong>
              <span>
                {data.user.demo
                  ? "Konto demonstracyjne"
                  : "Twoje konto klienta"}
              </span>
            </div>
            <button
              className="icon-button"
              onClick={() =>
                setModal({ type: data.user.demo ? "auth" : "account" })
              }
              aria-label="Ustawienia konta"
            >
              <Settings2 size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobile(true)}
              aria-label="Otwórz menu"
            >
              <Menu />
            </button>
            <span>Twoja przestrzeń spokoju</span>
            <span className="topbar-divider" />
            <span className="topbar-caption">Dobrze, że jesteś.</span>
          </div>
          <div className="topbar-right">
            <div className="notification-wrap">
              <button
                className={`icon-button bell ${notices ? "selected" : ""}`}
                aria-label={`Powiadomienia${unread ? `, ${unread} nieprzeczytanych` : ""}`}
                onClick={() => {
                  setNotices(!notices);
                  setAccountMenu(false);
                }}
              >
                <Bell size={20} />
                {unread > 0 && <span className="notification-dot" />}
              </button>
              {notices && (
                <>
                  <div
                    className="popover-away"
                    onClick={() => setNotices(false)}
                  />
                  <div className="notifications popover">
                    <div className="popover-title">
                      <strong>Powiadomienia</strong>
                      <span>{unread} nowych</span>
                    </div>
                    {data.notifications.length ? (
                      data.notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => openNotice(n)}
                          className={`notification ${!n.read ? "unread" : ""}`}
                        >
                          <span className="notification-symbol">
                            <CircleCheck size={20} />
                          </span>
                          <span>
                            <strong>{n.title}</strong>
                            <p>{n.body}</p>
                            <small>{date(n.date, { year: "numeric" })}</small>
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="muted small pad">
                        Jesteś na bieżąco. Tutaj pojawią się informacje o Twoich
                        zamówieniach.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
            <span className="header-line" />
            <div className="account-wrap">
              <button
                className="account-button"
                onClick={() => {
                  setAccountMenu(!accountMenu);
                  setNotices(false);
                }}
              >
                <span className="avatar small-avatar">
                  {initials(data.user.name)}
                </span>
                <span>{data.user.name.split(" ")[0]}</span>
                <ChevronDown size={14} />
              </button>
              {accountMenu && (
                <>
                  <div
                    className="popover-away"
                    onClick={() => setAccountMenu(false)}
                  />
                  <div className="account-popover popover">
                    <strong>{data.user.name}</strong>
                    <small>
                      {data.user.demo
                        ? "Poznajesz wersję demonstracyjną"
                        : data.user.email}
                    </small>
                    <button
                      onClick={() => {
                        setAccountMenu(false);
                        setModal({ type: data.user.demo ? "auth" : "account" });
                      }}
                    >
                      <UserRound size={16} />
                      {data.user.demo
                        ? "Zaloguj się / załóż konto"
                        : "Ustawienia konta"}
                    </button>
                    {!data.user.demo && (
                      <button
                        onClick={async () => {
                          await api("/auth/logout", { method: "POST" });
                          setAccountMenu(false);
                          await refresh();
                          go("dashboard");
                          notify("Wylogowano z konta.");
                        }}
                      >
                        <LogOut size={16} />
                        Wyloguj się
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main>
          {failure && (
            <div className="connection-error" role="alert">
              {failure} <button onClick={load}>Połącz ponownie</button>
            </div>
          )}
          {page === "dashboard" && (
            <Dashboard
              data={data}
              active={active}
              completed={completed}
              go={go}
              openOrder={openOrder}
              openReport={openReport}
              setModal={setModal}
            />
          )}
          {page === "orders" && (
            <Orders data={data} openOrder={openOrder} openReport={openReport} />
          )}
          {page === "graves" && (
            <Graves data={data} openOrder={openOrder} setModal={setModal} />
          )}
          {page === "reports" && (
            <Reports orders={completed} openReport={openReport} />
          )}
          {page === "help" && <Help setModal={setModal} />}
          {page === "admin" && data.user.role === "admin" && (
            <Admin notify={notify} refresh={refresh} />
          )}
          {![
            "dashboard",
            "orders",
            "graves",
            "reports",
            "help",
            "admin",
          ].includes(page) && (
            <Empty
              title="Nie znaleźliśmy tej strony"
              description="Wróć do swojego panelu klienta."
              action={
                <Button onClick={() => go("dashboard")}>
                  Przejdź do pulpitu
                </Button>
              }
            />
          )}
          <footer className="footer">
            <span>© {new Date().getFullYear()} ZadbanyNagrobek.pl</span>
            <span>
              <Sprout size={14} /> Z szacunkiem do wspomnień.
            </span>
            <button onClick={() => setModal({ type: "privacy" })}>
              Prywatność i bezpieczeństwo
            </button>
          </footer>
        </main>
      </div>
      {data.user.demo && (
        <button className="demo-tag" onClick={() => setModal({ type: "auth" })}>
          <span /> Wersja demonstracyjna <ArrowUpRight size={13} />
        </button>
      )}
      {toast && (
        <div className="toast" role="status">
          <CircleCheck size={20} />
          {toast}
          <button
            onClick={() => setToast("")}
            aria-label="Zamknij powiadomienie"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {modal?.type === "order" && (
        <OrderModal
          data={data}
          initialGrave={modal.grave}
          onClose={() => setModal(null)}
          onSuccess={async () => {
            setModal(null);
            await refresh();
            go("orders");
            notify("Dziękujemy. Twoje zamówienie zostało przyjęte.");
          }}
        />
      )}
      {modal?.type === "grave" && (
        <GraveModal
          grave={modal.grave}
          onClose={() => setModal(null)}
          onSuccess={async () => {
            setModal(null);
            await refresh();
            notify(
              modal.grave
                ? "Zapisano zmiany nagrobka."
                : "Dodano nagrobek do Twojego konta.",
            );
          }}
        />
      )}
      {modal?.type === "auth" && (
        <AuthModal
          onClose={() => setModal(null)}
          onSuccess={async () => {
            setModal(null);
            await refresh();
            go("dashboard");
            notify("Witaj w swojej przestrzeni.");
          }}
        />
      )}
      {modal?.type === "account" && (
        <AccountModal
          user={data.user}
          onClose={() => setModal(null)}
          onSuccess={async () => {
            setModal(null);
            await refresh();
            notify("Zapisano dane konta.");
          }}
        />
      )}
      {modal?.type === "report" && (
        <ReportModal
          isDemo={data.user.demo}
          order={modal.order}
          onClose={() => setModal(null)}
          onCancel={async (id) => {
            await api(`/orders/${id}/cancel`, { method: "POST" });
            setModal(null);
            await refresh();
            notify("Zamówienie zostało anulowane.");
          }}
        />
      )}
      {modal?.type === "privacy" && (
        <Modal
          title="Twoja prywatność ma znaczenie"
          onClose={() => setModal(null)}
        >
          <div className="modal-body prose">
            <ShieldCheck size={36} className="green" />
            <p>
              Dane konta, zamówienia oraz zdjęcia z realizacji są dostępne po
              zalogowaniu. Zdjęcia Twoich nagrobków może zobaczyć wyłącznie
              właściciel konta i uprawniony pracownik obsługi.
            </p>
            <p>
              Hasła przechowujemy w postaci zabezpieczonego skrótu. Sesja
              korzysta z pliku cookie niezbędnego do działania aplikacji. Nie
              korzystamy z reklamowych plików cookie.
            </p>
            <p>
              Wersja demonstracyjna zawiera przykładowe dane i ilustracyjne
              zdjęcia wygenerowane na potrzeby prezentacji. Nie są to
              dokumentacje prawdziwych realizacji.
            </p>
            <p>
              W sprawie dostępu do swoich danych lub ich usunięcia skontaktuj
              się z administratorem usługi.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Welcome({ onSuccess }) {
  const [auth, setAuth] = useState(false);
  return (
    <div className="welcome">
      <section className="welcome-content">
        <a className="brand" href="/">
          <span className="brand-symbol">
            <Sprout size={30} />
          </span>
          <span>
            ZadbanyNagrobek<span className="brand-pl">.pl</span>
            <small>Z TROSKĄ O PAMIĘĆ</small>
          </span>
        </a>
        <div className="welcome-main">
          <span className="eyebrow">BLISKO, NAWET GDY JESTEŚ DALEKO</span>
          <h1>
            Ty pielęgnujesz
            <br />
            wspomnienia.
            <br />
            <em>My dbamy o resztę.</em>
          </h1>
          <p>
            Zamów opiekę nad miejscem pamięci swoich bliskich.
            <br />
            Śledź postępy i otrzymuj raporty ze zdjęciami.
            <br />Z troską, szacunkiem i spokojem.
          </p>
          <Button onClick={() => setAuth(true)}>
            Przejdź do swojego konta
            <ArrowRight size={18} />
          </Button>
          <div className="welcome-trust">
            <ShieldCheck size={18} />
            Bezpieczne konto<span>·</span>
            <Camera size={18} />
            Zdjęcia po każdej wizycie
          </div>
        </div>
        <small>
          © {new Date().getFullYear()} ZadbanyNagrobek.pl · Z szacunkiem do
          wspomnień.
        </small>
      </section>
      <div className="welcome-photo">
        <img
          src="/images/grave.jpg"
          alt="Zadbane miejsce pamięci w spokojnym, zielonym otoczeniu"
        />
        <span>
          <Sprout size={25} />
          Pamięć, która łączy pokolenia.
        </span>
      </div>
      {auth && (
        <AuthModal onClose={() => setAuth(false)} onSuccess={onSuccess} />
      )}
    </div>
  );
}

function PageHeading({ eyebrow, title, description, children }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="page-heading-actions">{children}</div>
    </div>
  );
}
function Dashboard({
  data,
  active,
  completed,
  go,
  openOrder,
  openReport,
  setModal,
}) {
  const upcoming = [...active].sort((a, b) => a.date.localeCompare(b.date))[0];
  const recent = [...completed].sort((a, b) =>
    (b.completed || b.date).localeCompare(a.completed || a.date),
  )[0];
  return (
    <>
      <PageHeading
        title={
          <>
            Dzień dobry, {greeting(data.user.name)}{" "}
            <span className="greeting-leaf">
              <Leaf size={25} strokeWidth={1.4} />
            </span>
          </>
        }
        description="Dobrze wiedzieć, że miejsca pamięci Twoich bliskich są pod opieką."
      >
        <Button onClick={() => openOrder()}>
          <Plus size={18} /> Zamów usługę
        </Button>
      </PageHeading>
      <section className="hero">
        <img
          src="/images/grave.jpg"
          alt="Zadbany kamienny nagrobek pośród zieleni, z białymi kwiatami i zniczami"
        />
        <div className="hero-shade" />
        <div className="hero-content">
          <span className="hero-eyebrow">
            <span /> BLISKO, NAWET GDY JESTEŚ DALEKO
          </span>
          <h2>
            Pamięć, która
            <br />
            łączy pokolenia.
          </h2>
          <p>
            Ty pielęgnujesz wspomnienia.
            <br />
            My z troską dbamy o miejsca pamięci.
          </p>
          <button onClick={() => go("help")}>
            Poznaj naszą opiekę <ArrowUpRight size={17} />
          </button>
        </div>
        <span className="hero-signature">
          <Sprout size={18} strokeWidth={1.4} /> Z troską o każdy detal
        </span>
      </section>
      <div className="stats-grid">
        <Stat
          icon={Landmark}
          number={data.graves.length}
          label="Nagrobki pod opieką"
          detail="Bliskie Ci miejsca"
          onClick={() => go("graves")}
        />
        <Stat
          icon={CalendarDays}
          number={active.length}
          label="Zaplanowane usługi"
          detail={
            upcoming
              ? `Najbliższa: ${date(upcoming.date)}`
              : "Zaplanuj kolejną wizytę"
          }
          onClick={() => go("orders")}
        />
        <Stat
          icon={CircleCheck}
          number={completed.length}
          label="Zrealizowane usługi"
          detail="Zawsze ze zdjęciami"
          onClick={() => go("reports")}
        />
      </div>
      <div className="dashboard-grid">
        <section className="section-block">
          <SectionTitle
            title="Najbliższa wizyta"
            action="Wszystkie zamówienia"
            onClick={() => go("orders")}
          />
          {upcoming ? (
            <div className="card upcoming-card">
              <div className="card-top">
                <div className="service-symbol">
                  <Sparkles size={22} strokeWidth={1.4} />
                </div>
                <Badge status={upcoming.status} />
              </div>
              <h3>{upcoming.service_name}</h3>
              <div className="grave-person">
                <Landmark size={16} />
                {upcoming.grave_name}
              </div>
              <p className="location-line">
                <MapPin size={15} />
                {upcoming.cemetery}, {upcoming.city}
              </p>
              <div className="visit-date">
                <div className="date-square">
                  <strong>{new Date(upcoming.date).getDate()}</strong>
                  <span>
                    {new Intl.DateTimeFormat("pl-PL", { month: "short" })
                      .format(new Date(upcoming.date))
                      .replace(".", "")}
                  </span>
                </div>
                <div>
                  <span>Planowany termin wizyty</span>
                  <strong>{date(upcoming.date, { year: "numeric" })}</strong>
                </div>
                <CalendarDays size={20} strokeWidth={1.4} />
              </div>
              <div className="order-progress">
                <span className="done">
                  <Check size={12} />
                </span>
                <i
                  className={upcoming.status === "in_progress" ? "reached" : ""}
                />
                <span
                  className={upcoming.status === "in_progress" ? "done" : ""}
                >
                  {upcoming.status === "in_progress" && <Check size={12} />}
                </span>
                <i />
                <span />
                <div>Przyjęte</div>
                <div>W realizacji</div>
                <div>Gotowe</div>
              </div>
              <div className="card-footer">
                <span>Nr {upcoming.id.slice(0, 8).toUpperCase()}</span>
                <button
                  className="text-link"
                  onClick={() => openReport(upcoming)}
                >
                  Szczegóły zamówienia <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="card">
              <Empty
                icon={CalendarDays}
                title="Zaplanuj chwilę troski"
                description="Wybierz usługę, a my zadbamy o miejsce pamięci Twoich bliskich."
                action={
                  <Button variant="secondary" onClick={() => openOrder()}>
                    <Plus size={16} /> Zamów pierwszą usługę
                  </Button>
                }
              />
            </div>
          )}
        </section>
        <section className="section-block">
          <SectionTitle
            title="Ostatnia realizacja"
            action="Wszystkie raporty"
            onClick={() => go("reports")}
          />
          {recent ? (
            <div className="card recent-card">
              <div className="recent-photo">
                <img
                  src="/images/grave.jpg"
                  alt={`Zadbany nagrobek – ${recent.grave_name}`}
                />
                <span className="photo-label">
                  <Camera size={13} /> Po wykonaniu usługi
                </span>
                <div className="completed-stamp">
                  <Check size={13} /> Zrealizowano
                </div>
              </div>
              <div className="recent-content">
                <div className="recent-date">
                  <CircleCheck size={15} />
                  {date(recent.completed || recent.date, { year: "numeric" })}
                </div>
                <h3>{recent.grave_name}</h3>
                <p>
                  <MapPin size={14} />
                  {recent.cemetery}, {recent.city}
                </p>
                <div className="recent-bottom">
                  <span>
                    <Images size={16} />
                    {recent.photos.length} zdjęcia z wizyty
                  </span>
                  <button
                    className="text-link"
                    onClick={() => openReport(recent)}
                  >
                    Zobacz raport <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <Empty
                icon={Camera}
                title="Troska widoczna na zdjęciach"
                description="Po wykonaniu pierwszej usługi znajdziesz tutaj raport oraz zdjęcia nagrobka."
              />
            </div>
          )}
        </section>
      </div>
      <section className="care-banner">
        <div className="care-banner-icon">
          <ShieldCheck size={25} strokeWidth={1.5} />
        </div>
        <div>
          <h4>Spokojna głowa. Zadbane wspomnienia.</h4>
          <p>
            Każdą wizytę kończymy raportem ze zdjęciami. Wiesz, że wszystko jest
            w dobrych rękach.
          </p>
        </div>
        <span className="care-banner-tag">
          <Heart size={15} /> Zawsze z szacunkiem
        </span>
      </section>
    </>
  );
}
function Stat({ icon: Icon, number, label, detail, onClick }) {
  return (
    <button className="stat-card" onClick={onClick}>
      <div className="stat-icon">
        <Icon size={23} strokeWidth={1.5} />
      </div>
      <div className="stat-body">
        <span className="stat-value">{number}</span>
        <strong>{label}</strong>
        <span>{detail}</span>
      </div>
      <ArrowUpRight size={17} className="stat-arrow" />
    </button>
  );
}
function SectionTitle({ title, action, onClick }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {action && (
        <button onClick={onClick}>
          {action}
          <ChevronRight size={15} />
        </button>
      )}
    </div>
  );
}

function Orders({ data, openOrder, openReport }) {
  const [filter, setFilter] = useState("all"),
    [search, setSearch] = useState("");
  const filtered = data.orders.filter(
    (o) =>
      (filter === "all" ||
        (filter === "active"
          ? ["scheduled", "in_progress"].includes(o.status)
          : o.status === filter)) &&
      `${o.grave_name} ${o.service_name} ${o.cemetery} ${o.id}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="TROSKA KROK PO KROKU"
        title="Moje zamówienia"
        description="Wszystkie wizyty w jednym miejscu. Od zamówienia do spokojnej głowy."
      >
        <Button onClick={() => openOrder()}>
          <Plus size={18} /> Zamów usługę
        </Button>
      </PageHeading>
      <div className="list-toolbar">
        <div className="tabs">
          {[
            ["all", "Wszystkie"],
            ["active", "Zaplanowane i w realizacji"],
            ["completed", "Zrealizowane"],
            ["cancelled", "Anulowane"],
          ].map(([id, label]) => (
            <button
              className={filter === id ? "active" : ""}
              key={id}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="search-box">
          <Search size={17} />
          <input
            aria-label="Szukaj zamówienia"
            placeholder="Szukaj zamówienia…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      {filtered.length ? (
        <div className="orders-list">
          {filtered.map((o) => (
            <article className="card order-row" key={o.id}>
              <div className={`order-icon ${o.status}`}>
                <Sparkles size={24} strokeWidth={1.5} />
              </div>
              <div className="order-main">
                <div className="order-title">
                  <h3>{o.service_name}</h3>
                  <Badge status={o.status} />
                </div>
                <p>
                  {o.grave_name} <span>·</span> {o.cemetery}
                </p>
                <div className="order-meta">
                  <span>
                    <CalendarDays size={14} />
                    {date(o.date, { year: "numeric" })}
                  </span>
                  <span>Nr {o.id.slice(0, 8).toUpperCase()}</span>
                </div>
              </div>
              <div className="order-right">
                <strong>{price(o.price)}</strong>
                <button className="text-link" onClick={() => openReport(o)}>
                  {o.status === "completed" ? "Zobacz raport" : "Szczegóły"}
                  <ArrowRight size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="card">
          <Empty
            icon={ClipboardList}
            title={
              search
                ? "Brak pasujących zamówień"
                : "Tutaj zaczyna się nasza opieka"
            }
            description={
              search
                ? "Spróbuj zmienić wyszukiwaną frazę lub filtr."
                : "Zamów pierwszą usługę i śledź jej realizację w tym miejscu."
            }
            action={
              !search && (
                <Button onClick={() => openOrder()}>
                  <Plus size={17} /> Zamów usługę
                </Button>
              )
            }
          />
        </div>
      )}
    </>
  );
}
function Graves({ data, openOrder, setModal }) {
  return (
    <>
      <PageHeading
        eyebrow="MIEJSCA BLISKIE SERCU"
        title="Moje nagrobki"
        description="Zapisz miejsca pamięci, by jeszcze łatwiej otoczyć je opieką."
      >
        <Button onClick={() => setModal({ type: "grave" })}>
          <Plus size={18} /> Dodaj nagrobek
        </Button>
      </PageHeading>
      {data.graves.length ? (
        <div className="grave-grid">
          {data.graves.map((g, i) => (
            <article className="card grave-card" key={g.id}>
              <div className={`grave-cover grave-cover-${i % 2}`}>
                <Landmark size={48} strokeWidth={0.9} />
                <span>MIEJSCE PAMIĘCI</span>
                <button
                  className="icon-button"
                  onClick={() => setModal({ type: "grave", grave: g })}
                  aria-label={`Edytuj nagrobek ${g.name}`}
                >
                  <Settings2 size={18} />
                </button>
              </div>
              <div className="grave-card-content">
                <h2>{g.name}</h2>
                <p>
                  <MapPin size={16} />
                  {g.cemetery}
                </p>
                <span className="grave-city">
                  {g.city} {g.sector && `· ${g.sector}`}
                </span>
                <div className="grave-location">
                  {g.location || "Szczegóły lokalizacji nie zostały dodane"}
                </div>
                {g.notes && <p className="grave-notes">{g.notes}</p>}
                <Button variant="secondary" onClick={() => openOrder(g)}>
                  <Plus size={17} /> Zamów opiekę
                  <ArrowRight size={16} />
                </Button>
              </div>
            </article>
          ))}
          <button
            className="add-grave-card"
            onClick={() => setModal({ type: "grave" })}
          >
            <span>
              <Plus size={25} />
            </span>
            <h3>Dodaj miejsce pamięci</h3>
            <p>
              Otocz opieką kolejne
              <br />
              bliskie Ci miejsce.
            </p>
          </button>
        </div>
      ) : (
        <div className="card">
          <Empty
            icon={Landmark}
            title="Zachowaj bliskie Ci miejsca"
            description="Dodaj pierwszy nagrobek. Wystarczy imię i nazwisko bliskiej osoby oraz lokalizacja cmentarza."
            action={
              <Button onClick={() => setModal({ type: "grave" })}>
                <Plus size={16} /> Dodaj nagrobek
              </Button>
            }
          />
        </div>
      )}
    </>
  );
}
function Reports({ orders, openReport }) {
  return (
    <>
      <PageHeading
        eyebrow="TROSKA, KTÓRĄ WIDAĆ"
        title="Zdjęcia i raporty"
        description="Zobacz efekty naszej pracy. Każda wizyta opowiedziana zdjęciami."
      />
      {orders.length ? (
        <div className="report-grid">
          {orders.map((o) => (
            <article className="card report-card" key={o.id}>
              <div className="report-image">
                {o.photos.length ? (
                  <img
                    src={
                      o.photos.find((p) => p.kind === "after")?.url ||
                      o.photos[0].url
                    }
                    alt={`Raport z opieki nad nagrobkiem ${o.grave_name}`}
                  />
                ) : (
                  <div className="no-photo">
                    <Camera size={40} />
                    <span>Brak zdjęć archiwalnych</span>
                  </div>
                )}
                <Badge status="completed" />
              </div>
              <div className="report-card-content">
                <span className="recent-date">
                  <CalendarDays size={14} />
                  {date(o.completed || o.date, { year: "numeric" })}
                </span>
                <h2>{o.grave_name}</h2>
                <p>{o.service_name}</p>
                <div className="report-card-footer">
                  <span>
                    <Camera size={16} />
                    {o.photos.length} zdjęcia
                  </span>
                  <button className="text-link" onClick={() => openReport(o)}>
                    Otwórz raport
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="card">
          <Empty
            icon={Images}
            title="Wspomnienia pod dobrą opieką"
            description="Po realizacji zamówienia znajdziesz tutaj opis wykonanych prac oraz zdjęcia. O gotowym raporcie poinformujemy Cię w panelu."
          />
        </div>
      )}
    </>
  );
}
function Help({ setModal }) {
  const [open, setOpen] = useState(0);
  const faqs = [
    [
      "Jak wygląda opieka nad nagrobkiem?",
      "Wybierasz zakres usługi, wskazujesz nagrobek i preferowany termin. Nasz opiekun wykonuje prace, a po zakończeniu publikuje raport ze zdjęciami. Każdy etap możesz śledzić w swoim panelu.",
    ],
    [
      "Czy otrzymam zdjęcia po wykonaniu usługi?",
      "Tak. Po zakończeniu usługi opiekun dodaje opis wykonanych prac i zdjęcia. Otrzymasz powiadomienie w aplikacji, a dokumentację znajdziesz w sekcji „Zdjęcia i raporty”.",
    ],
    [
      "Jak mogę zmienić lub anulować zamówienie?",
      "Zaplanowane zamówienie możesz anulować w jego szczegółach. Jeśli prace już się rozpoczęły, skontaktuj się z obsługą. Aby zmienić termin przed rozpoczęciem prac, anuluj zamówienie i złóż nowe.",
    ],
    [
      "Co zrobić, jeśli nie znam dokładnego położenia grobu?",
      "Dodając nagrobek, podaj nazwę cmentarza, miejscowość oraz imiona i nazwiska zmarłych. W uwagach opisz to, co pamiętasz o lokalizacji. W razie trudności opiekun skontaktuje się z Tobą przed realizacją.",
    ],
    [
      "Jak działa płatność?",
      "Zamówienie w panelu jest zgłoszeniem usługi. Warunki płatności i dostępność terminu potwierdza obsługa. Aplikacja nie pobiera automatycznie środków ani danych Twojej karty.",
    ],
  ];
  return (
    <>
      <PageHeading
        eyebrow="PO LUDZKU, Z TROSKĄ"
        title="Jesteśmy tu dla Ciebie"
        description="Chętnie pomożemy zadbać o to, co dla Ciebie ważne."
      />
      <section className="help-hero">
        <div>
          <span className="eyebrow">NIE MUSISZ BYĆ Z TYM SAM</span>
          <h2>
            Blisko Twoich potrzeb.
            <br />Z szacunkiem do wspomnień.
          </h2>
          <p>
            Wiemy, jak ważne jest poczucie spokoju.
            <br />
            Dlatego dbamy o każdy detal — od pierwszego
            <br />
            zamówienia po zdjęcie zadbanego miejsca pamięci.
          </p>
          <a className="btn" href="mailto:kontakt@zadbanynagrobek.pl">
            <Mail size={18} />
            Napisz do nas
          </a>
        </div>
        <div className="help-illustration">
          <Sprout size={155} strokeWidth={0.7} />
          <span>Z troską o pamięć</span>
        </div>
      </section>
      <div className="help-layout">
        <div>
          <SectionTitle title="Warto wiedzieć" />
          {faqs.map(([q, a], i) => (
            <div className={`faq ${open === i ? "expanded" : ""}`} key={q}>
              <button
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? -1 : i)}
              >
                {q}
                <Plus size={18} />
              </button>
              {open === i && <p>{a}</p>}
            </div>
          ))}
        </div>
        <aside className="contact-card">
          <div className="stat-icon">
            <Mail size={24} />
          </div>
          <h3>Porozmawiajmy</h3>
          <p>Masz pytanie dotyczące zamówienia lub opieki? Napisz do nas.</p>
          <a href="mailto:kontakt@zadbanynagrobek.pl">
            kontakt@zadbanynagrobek.pl
            <ArrowUpRight size={17} />
          </a>
          <div className="contact-note">
            <Clock3 size={16} />
            <span>
              Odpowiadamy w dni robocze.
              <br />
              Do wiadomości dołącz numer zamówienia.
            </span>
          </div>
        </aside>
      </div>
    </>
  );
}

function GraveForm({ values, setValues }) {
  const change = (e) =>
    setValues({ ...values, [e.target.name]: e.target.value });
  return (
    <div className="form-grid">
      <Field label="Imię i nazwisko osoby zmarłej / osób zmarłych *">
        <input
          name="name"
          required
          minLength={2}
          maxLength={180}
          placeholder="np. Jan i Maria Kowalscy"
          value={values.name}
          onChange={change}
        />
      </Field>
      <div className="field-row">
        <Field label="Nazwa cmentarza *">
          <input
            name="cemetery"
            required
            minLength={2}
            maxLength={180}
            placeholder="np. Cmentarz Powązkowski"
            value={values.cemetery}
            onChange={change}
          />
        </Field>
        <Field label="Miejscowość *">
          <input
            name="city"
            required
            minLength={2}
            maxLength={180}
            placeholder="np. Warszawa"
            value={values.city}
            onChange={change}
          />
        </Field>
      </div>
      <div className="field-row">
        <Field label="Kwatera / sektor">
          <input
            name="sector"
            maxLength={100}
            placeholder="np. Kwatera 154"
            value={values.sector}
            onChange={change}
          />
        </Field>
        <Field label="Rząd i numer grobu">
          <input
            name="location"
            maxLength={180}
            placeholder="np. Rząd 3, grób 12"
            value={values.location}
            onChange={change}
          />
        </Field>
      </div>
      <Field label="Wskazówki dotyczące lokalizacji">
        <textarea
          name="notes"
          rows={3}
          maxLength={1000}
          placeholder="Dodatkowe informacje, które pomogą odnaleźć nagrobek…"
          value={values.notes}
          onChange={change}
        />
      </Field>
    </div>
  );
}
const blankGrave = {
  name: "",
  cemetery: "",
  city: "",
  sector: "",
  location: "",
  notes: "",
};
function GraveModal({ grave, onClose, onSuccess }) {
  const [values, setValues] = useState(grave ? { ...grave } : blankGrave),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(grave ? `/graves/${grave.id}` : "/graves", {
        method: grave ? "PATCH" : "POST",
        body: values,
      });
      await onSuccess();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={grave ? "Edytuj miejsce pamięci" : "Dodaj miejsce pamięci"}
      subtitle="Zapisz lokalizację, a my zadbamy o resztę."
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="modal-body">
          <GraveForm values={values} setValues={setValues} />
          <ErrorMessage error={error} />
        </div>
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Anuluj
          </Button>
          <Button loading={busy}>
            {grave ? "Zapisz zmiany" : "Dodaj nagrobek"}
            <Check size={17} />
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function OrderModal({ data, initialGrave, onClose, onSuccess }) {
  const [step, setStep] = useState(1),
    [service, setService] = useState("complete"),
    [grave, setGrave] = useState(initialGrave?.id || data.graves[0]?.id || ""),
    [newGrave, setNewGrave] = useState(!data.graves.length),
    [graveValues, setGraveValues] = useState(blankGrave),
    [when, setWhen] = useState(() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().slice(0, 10);
    }),
    [selectedExtras, setSelectedExtras] = useState([]),
    [notes, setNotes] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const selectedService = data.services.find((s) => s.id === service),
    total =
      selectedService.price +
      data.extras
        .filter((x) => selectedExtras.includes(x.id))
        .reduce((n, x) => n + x.price, 0);
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    setBusy(true);
    try {
      let graveId = grave;
      if (newGrave) {
        const added = await api("/graves", {
          method: "POST",
          body: graveValues,
        });
        graveId = added.id;
        setGrave(graveId);
        setNewGrave(false);
      }
      await api("/orders", {
        method: "POST",
        body: {
          grave_id: graveId,
          service,
          date: when,
          extras: selectedExtras,
          notes,
        },
      });
      await onSuccess();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      wide
      title="Otocz wspomnienia opieką"
      subtitle="Kilka prostych kroków. Dużo więcej spokoju."
      onClose={onClose}
    >
      <div className="steps">
        {["Wybierz usługę", "Miejsce pamięci", "Termin i podsumowanie"].map(
          (s, i) => (
            <React.Fragment key={s}>
              {i > 0 && <i />}
              <span className={step >= i + 1 ? "current" : ""}>
                <b>{step > i + 1 ? <Check size={14} /> : i + 1}</b>
                <span>{s}</span>
              </span>
            </React.Fragment>
          ),
        )}
      </div>
      <form onSubmit={submit}>
        <div className="modal-body order-modal-body" key={step}>
          {step === 1 && (
            <>
              <h3 className="step-title">
                Jak możemy zadbać o Twoich bliskich?
              </h3>
              <p className="muted small">
                Wybierz zakres opieki dopasowany do potrzeb miejsca pamięci.
              </p>
              <div className="service-options">
                {data.services.map((s, i) => (
                  <button
                    type="button"
                    className={`service-option ${service === s.id ? "chosen" : ""}`}
                    onClick={() => setService(s.id)}
                    key={s.id}
                  >
                    {i === 1 && (
                      <span className="popular-label">
                        NAJCZĘŚCIEJ WYBIERANA
                      </span>
                    )}
                    <div className="service-option-top">
                      {i === 0 ? (
                        <Leaf size={25} />
                      ) : i === 1 ? (
                        <Sparkles size={25} />
                      ) : (
                        <Flower2 size={25} />
                      )}
                      <span className="radio-dot">
                        {service === s.id && <span />}
                      </span>
                    </div>
                    <h4>{s.name}</h4>
                    <p>{s.description}</p>
                    <strong>
                      {price(s.price)}
                      <small> / wizyta</small>
                    </strong>
                    <ul>
                      {s.features.map((f) => (
                        <li key={f}>
                          <Check size={14} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
              <div className="info-note">
                <ShieldCheck size={18} />W cenie każdej usługi: troska, szacunek
                i dokumentacja zdjęciowa.
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h3 className="step-title">Które miejsce otoczymy opieką?</h3>
              <p className="muted small">
                Wybierz zapisany nagrobek lub dodaj nowe miejsce pamięci.
              </p>
              <div className="grave-options">
                {data.graves.map((g) => (
                  <button
                    type="button"
                    className={`grave-option ${!newGrave && grave === g.id ? "chosen" : ""}`}
                    onClick={() => {
                      setNewGrave(false);
                      setGrave(g.id);
                    }}
                    key={g.id}
                  >
                    <Landmark size={23} />
                    <span>
                      <strong>{g.name}</strong>
                      <small>
                        {g.cemetery}, {g.city}
                      </small>
                    </span>
                    <span className="radio-dot">
                      {!newGrave && grave === g.id && <span />}
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  className={`grave-option add-option ${newGrave ? "chosen" : ""}`}
                  onClick={() => setNewGrave(true)}
                >
                  <Plus size={21} /> Dodaj nowe miejsce pamięci
                </button>
              </div>
              {newGrave && (
                <GraveForm values={graveValues} setValues={setGraveValues} />
              )}
            </>
          )}
          {step === 3 && (
            <>
              <h3 className="step-title">Jeszcze odrobina szczegółów</h3>
              <div className="summary-layout">
                <div>
                  <Field
                    label="Preferowany termin wizyty *"
                    hint="Dostępność wybranego terminu potwierdzi obsługa."
                  >
                    <input
                      type="date"
                      min={today()}
                      max={`${new Date().getFullYear() + 2}-12-31`}
                      required
                      value={when}
                      onChange={(e) => setWhen(e.target.value)}
                    />
                  </Field>
                  <h4 className="extras-heading">Drobny gest pamięci</h4>
                  <div className="extras-options">
                    {data.extras.map((x) => (
                      <label
                        className={`extra-option ${selectedExtras.includes(x.id) ? "chosen" : ""}`}
                        key={x.id}
                      >
                        <input
                          type="checkbox"
                          checked={selectedExtras.includes(x.id)}
                          onChange={(e) =>
                            setSelectedExtras(
                              e.target.checked
                                ? [...selectedExtras, x.id]
                                : selectedExtras.filter((v) => v !== x.id),
                            )
                          }
                        />
                        {x.id === "candle" ? (
                          <Flame size={18} />
                        ) : (
                          <Flower2 size={18} />
                        )}
                        <span>{x.name}</span>
                        <strong>+{price(x.price)}</strong>
                      </label>
                    ))}
                  </div>
                  <Field label="Uwagi dla opiekuna">
                    <textarea
                      rows={3}
                      maxLength={1500}
                      placeholder="Czy jest coś, o czym powinniśmy wiedzieć?"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </Field>
                </div>
                <aside className="order-summary">
                  <span className="eyebrow">TWOJE ZAMÓWIENIE</span>
                  <h4>{selectedService.name}</h4>
                  <p>
                    <Landmark size={16} />
                    {newGrave
                      ? graveValues.name
                      : data.graves.find((g) => g.id === grave)?.name}
                  </p>
                  <div className="summary-lines">
                    <span>
                      Wybrana usługa
                      <strong>{price(selectedService.price)}</strong>
                    </span>
                    {data.extras
                      .filter((x) => selectedExtras.includes(x.id))
                      .map((x) => (
                        <span key={x.id}>
                          {x.name}
                          <strong>{price(x.price)}</strong>
                        </span>
                      ))}
                  </div>
                  <div className="summary-total">
                    <span>Łącznie</span>
                    <strong>{price(total)}</strong>
                  </div>
                  <small>
                    Złożenie zamówienia nie obciąża Twojego konta. Płatność
                    ustalisz z obsługą.
                  </small>
                </aside>
              </div>
            </>
          )}
          <ErrorMessage error={error} />
        </div>
        <div className="modal-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => (step === 1 ? onClose() : setStep(step - 1))}
          >
            {step === 1 ? (
              "Anuluj"
            ) : (
              <>
                <ChevronLeft size={16} /> Wstecz
              </>
            )}
          </Button>
          <span className="step-count">Krok {step} z 3</span>
          <Button loading={busy} disabled={step === 2 && !newGrave && !grave}>
            {step === 3 ? "Zamów usługę" : "Dalej"}
            <ArrowRight size={17} />
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function AuthModal({ onClose, onSuccess }) {
  const [mode, setMode] = useState("register"),
    [values, setValues] = useState({
      name: "",
      email: "",
      password: "",
      phone: "",
    }),
    [show, setShow] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const change = (e) =>
    setValues({ ...values, [e.target.name]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/auth/${mode}`, { method: "POST", body: values });
      await onSuccess();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={
        mode === "register"
          ? "Witaj w dobrych rękach"
          : "Dobrze Cię znów widzieć"
      }
      subtitle={
        mode === "register"
          ? "Załóż konto i zadbaj o miejsca pamięci swoich bliskich."
          : "Zaloguj się do swojego panelu klienta."
      }
      onClose={onClose}
    >
      <div className="auth-tabs">
        <button
          className={mode === "register" ? "active" : ""}
          onClick={() => {
            setMode("register");
            setError("");
          }}
        >
          Załóż konto
        </button>
        <button
          className={mode === "login" ? "active" : ""}
          onClick={() => {
            setMode("login");
            setError("");
          }}
        >
          Zaloguj się
        </button>
      </div>
      <form onSubmit={submit}>
        <div className="modal-body form-grid">
          {mode === "register" && (
            <Field label="Imię i nazwisko *">
              <input
                autoComplete="name"
                name="name"
                required
                minLength={2}
                maxLength={180}
                placeholder="Anna Kowalska"
                value={values.name}
                onChange={change}
              />
            </Field>
          )}
          <Field label="Adres e-mail *">
            <input
              type="email"
              autoComplete="email"
              name="email"
              maxLength={200}
              required
              placeholder="twoj@email.pl"
              value={values.email}
              onChange={change}
            />
          </Field>
          <Field
            label="Hasło *"
            hint={
              mode === "register"
                ? "Minimum 8 znaków. Wybierz unikalne hasło."
                : undefined
            }
          >
            <div className="password-field">
              <input
                type={show ? "text" : "password"}
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
                name="password"
                minLength={mode === "register" ? 8 : 1}
                maxLength={128}
                required
                placeholder="Wpisz hasło"
                value={values.password}
                onChange={change}
              />
              <button
                type="button"
                aria-label={show ? "Ukryj hasło" : "Pokaż hasło"}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>
          {mode === "register" && (
            <>
              <Field label="Numer telefonu (opcjonalnie)">
                <input
                  type="tel"
                  autoComplete="tel"
                  name="phone"
                  maxLength={30}
                  placeholder="+48 000 000 000"
                  value={values.phone}
                  onChange={change}
                />
              </Field>
              <p className="auth-note">
                <ShieldCheck size={17} />
                Twoje dane służą wyłącznie obsłudze konta i zamówień. Wersja
                demonstracyjna nie jest przenoszona na nowe konto.
              </p>
            </>
          )}
          <ErrorMessage error={error} />
          <Button loading={busy} className="full-width">
            {mode === "register" ? "Załóż bezpłatne konto" : "Zaloguj się"}
            <ArrowRight size={17} />
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function AccountModal({ user, onClose, onSuccess }) {
  const [name, setName] = useState(user.name),
    [phone, setPhone] = useState(user.phone),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Modal
      title="Twoje konto"
      subtitle="Aktualne dane pomogą nam pozostać w kontakcie."
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api("/account", { method: "PATCH", body: { name, phone } });
            await onSuccess();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="modal-body form-grid">
          <Field label="Imię i nazwisko">
            <input
              required
              minLength={2}
              maxLength={180}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Adres e-mail">
            <input value={user.email} disabled />
          </Field>
          <Field label="Numer telefonu">
            <input
              type="tel"
              maxLength={30}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          <ErrorMessage error={error} />
        </div>
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Anuluj
          </Button>
          <Button loading={busy}>Zapisz zmiany</Button>
        </div>
      </form>
    </Modal>
  );
}
function ReportModal({ order: o, onClose, onCancel, isDemo }) {
  const [view, setView] = useState(null),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const download = async (p) => {
    try {
      const r = await fetch(p.url);
      if (!r.ok) throw new Error("Nie udało się pobrać zdjęcia.");
      const blob = await r.blob(),
        url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = `nagrobek-${o.id.slice(0, 8)}-${p.kind}-${p.id.slice(0, 4)}.${blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg"}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <Modal
      wide
      title={
        o.status === "completed"
          ? "Zadbane miejsce. Spokojne serce."
          : "Szczegóły Twojego zamówienia"
      }
      subtitle={`Zamówienie nr ${o.id.slice(0, 8).toUpperCase()}`}
      onClose={onClose}
    >
      <div className="modal-body">
        {isDemo && (
          <div className="demo-report-note">
            <Info size={15} />
            Przykładowa realizacja. Zdjęcia są ilustracjami wygenerowanymi na
            potrzeby prezentacji.
          </div>
        )}
        <div className="report-detail-header">
          <div>
            <h3>{o.grave_name}</h3>
            <p>
              <MapPin size={15} />
              {o.cemetery}, {o.city}
            </p>
          </div>
          <Badge status={o.status} />
        </div>
        <div className="report-details">
          <span>
            <Sparkles size={19} />
            <small>
              Wybrana usługa<strong>{o.service_name}</strong>
            </small>
          </span>
          <span>
            <CalendarDays size={19} />
            <small>
              {o.status === "completed"
                ? "Data realizacji"
                : "Planowany termin"}
              <strong>
                {date(o.completed || o.date, { year: "numeric" })}
              </strong>
            </small>
          </span>
          <span>
            <FileText size={19} />
            <small>
              Wartość usługi<strong>{price(o.price)}</strong>
            </small>
          </span>
        </div>
        {o.status === "completed" ? (
          <>
            <h4 className="report-section-title">Kilka słów od opiekuna</h4>
            <div className="caretaker-note">
              <span className="caretaker-avatar">
                <Sprout size={23} />
              </span>
              <div>
                <strong>Zespół ZadbanyNagrobek.pl</strong>
                <p>{o.report || "Usługa została zrealizowana."}</p>
              </div>
            </div>
            <div className="section-title">
              <h2>Zdjęcia z wizyty</h2>
              <span className="muted small">
                Kliknij zdjęcie, aby je powiększyć
              </span>
            </div>
            {o.photos.length ? (
              <div className="detail-photos">
                {o.photos.map((p) => (
                  <div className="detail-photo" key={p.id}>
                    <button onClick={() => setView(p)}>
                      <img
                        src={p.url}
                        alt={`${p.kind === "before" ? "Przed" : "Po"} wykonaniu usługi — ${o.grave_name}`}
                      />
                      <span className="photo-zoom">
                        <Search size={21} />
                      </span>
                      <span className="photo-label">
                        {p.kind === "before" ? "Przed wizytą" : "Po wykonaniu"}
                      </span>
                    </button>
                    <button
                      className="download-photo"
                      onClick={() => download(p)}
                    >
                      <Download size={14} /> Pobierz zdjęcie
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="info-note">
                <Camera size={18} />
                Ten archiwalny raport nie zawiera zdjęć.
              </div>
            )}
          </>
        ) : (
          <>
            <div className="info-note">
              <Info size={18} />
              {o.status === "cancelled"
                ? "To zamówienie zostało anulowane. W każdej chwili możesz zamówić nową usługę."
                : "Po zakończeniu opieki pojawią się tutaj raport i zdjęcia. O zmianie statusu poinformujemy Cię w panelu."}
            </div>
            <div className="order-location">
              <h4>Lokalizacja nagrobka</h4>
              <p>
                {[o.sector, o.location].filter(Boolean).join(" · ") ||
                  "Brak dodatkowych wskazówek lokalizacji."}
              </p>
              {o.grave_notes && <p>{o.grave_notes}</p>}
            </div>
            {o.notes && (
              <div className="order-location">
                <h4>Twoje uwagi dla opiekuna</h4>
                <p>{o.notes}</p>
              </div>
            )}
          </>
        )}
        {o.status === "scheduled" && (
          <div className="cancel-section">
            {confirm ? (
              <>
                <p>Czy na pewno chcesz anulować tę wizytę?</p>
                <Button variant="secondary" onClick={() => setConfirm(false)}>
                  Zachowaj zamówienie
                </Button>
                <Button
                  variant="danger"
                  loading={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await onCancel(o.id);
                    } catch (e) {
                      setError(e.message);
                      setBusy(false);
                    }
                  }}
                >
                  Tak, anuluj
                </Button>
              </>
            ) : (
              <button onClick={() => setConfirm(true)}>
                Anuluj zamówienie
              </button>
            )}
          </div>
        )}
        <ErrorMessage error={error} />
      </div>
      {view && (
        <div className="lightbox">
          <div className="lightbox-top">
            <span>
              {view.kind === "before" ? "Przed wizytą" : "Po wykonaniu usługi"}
            </span>
            <button
              className="icon-button"
              onClick={() => setView(null)}
              aria-label="Zamknij powiększone zdjęcie"
            >
              <X />
            </button>
          </div>
          <img src={view.url} alt="Powiększona dokumentacja nagrobka" />
          <Button variant="secondary" onClick={() => download(view)}>
            <Download size={17} /> Pobierz zdjęcie
          </Button>
        </div>
      )}
    </Modal>
  );
}
function Admin({ notify, refresh }) {
  const [orders, setOrders] = useState([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [selected, setSelected] = useState(null),
    [filter, setFilter] = useState("all");
  const load = async () => {
    try {
      setOrders(await api("/admin/orders"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  return (
    <>
      <PageHeading
        eyebrow="PANEL OBSŁUGI"
        title="Opieka w dobrych rękach"
        description="Zarządzaj realizacjami, dodawaj raporty i informuj klientów o wykonanych pracach."
      >
        <Button variant="secondary" onClick={load}>
          Odśwież zamówienia
        </Button>
      </PageHeading>
      <ErrorMessage error={error} />
      <div className="tabs standalone-tabs">
        {[
          ["all", "Wszystkie"],
          ["scheduled", "Zaplanowane"],
          ["in_progress", "W realizacji"],
          ["completed", "Zakończone"],
        ].map(([s, l]) => (
          <button
            key={s}
            className={filter === s ? "active" : ""}
            onClick={() => setFilter(s)}
          >
            {l}
          </button>
        ))}
      </div>
      {loading ? (
        <LoaderCircle className="spin" />
      ) : orders.filter((o) => filter === "all" || o.status === filter)
          .length ? (
        <div className="orders-list">
          {orders
            .filter((o) => filter === "all" || o.status === filter)
            .map((o) => (
              <div className="card order-row" key={o.id}>
                <div className="order-icon">
                  <Landmark size={24} />
                </div>
                <div className="order-main">
                  <div className="order-title">
                    <h3>{o.grave_name}</h3>
                    <Badge status={o.status} />
                  </div>
                  <p>
                    {o.service_name} · {o.cemetery}, {o.city}
                  </p>
                  <div className="order-meta">
                    <span>
                      <CalendarDays size={14} />
                      {date(o.date, { year: "numeric" })}
                    </span>
                    <span>
                      {o.customer_name} · {o.customer_email}
                    </span>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => setSelected(o)}>
                  Obsłuż
                  <ArrowRight size={16} />
                </Button>
              </div>
            ))}
        </div>
      ) : (
        <div className="card">
          <Empty
            icon={ClipboardList}
            title="Wszystko pod kontrolą"
            description="Nie ma zamówień pasujących do wybranego widoku. Zamówienia klientów pojawią się tutaj automatycznie."
          />
        </div>
      )}
      {selected && (
        <AdminModal
          order={selected}
          onClose={() => setSelected(null)}
          onSuccess={async () => {
            setSelected(null);
            await load();
            await refresh();
            notify(
              "Zapisano realizację. Klient otrzymał powiadomienie w panelu.",
            );
          }}
        />
      )}
    </>
  );
}
function AdminModal({ order: o, onClose, onSuccess }) {
  const [status, setStatus] = useState(o.status),
    [report, setReport] = useState(o.report || ""),
    [before, setBefore] = useState([]),
    [after, setAfter] = useState([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Modal
      title="Obsługa realizacji"
      subtitle={`Zamówienie ${o.id.slice(0, 8).toUpperCase()} · ${o.customer_name}`}
      wide
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          setBusy(true);
          try {
            const body = new FormData();
            body.append("status", status);
            body.append("report", report);
            before.forEach((f) => body.append("before", f));
            after.forEach((f) => body.append("after", f));
            await api(`/admin/orders/${o.id}`, { method: "PATCH", body });
            await onSuccess();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="modal-body form-grid">
          <div className="info-note">
            <MapPin size={20} />
            <div>
              <strong>{o.grave_name}</strong>
              <p>
                {o.cemetery}, {o.city} ·{" "}
                {[o.sector, o.location].filter(Boolean).join(", ")}
              </p>
              {o.grave_notes && <p>Wskazówki lokalizacji: {o.grave_notes}</p>}
              {o.notes && <p>Uwagi do usługi: {o.notes}</p>}
              <p>
                {o.customer_email}
                {o.customer_phone && ` · ${o.customer_phone}`}
              </p>
            </div>
          </div>
          <Field label="Status zamówienia">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {Object.entries(statusLabels).map(([s, l]) => (
                <option key={s} value={s}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Raport z wykonanych prac"
            hint="Przy zakończeniu usługi opis i zdjęcie po realizacji są wymagane."
          >
            <textarea
              rows={5}
              required={status === "completed"}
              maxLength={3000}
              value={report}
              onChange={(e) => setReport(e.target.value)}
              placeholder="Opisz wykonane prace i stan miejsca pamięci…"
            />
          </Field>
          <div className="field-row">
            {[
              ["before", "Zdjęcia przed wizytą", setBefore, before],
              ["after", "Zdjęcia po realizacji", setAfter, after],
            ].map(([key, label, setFiles, files]) => (
              <Field
                key={key}
                label={label}
                hint="Do 4 plików JPG, PNG lub WebP; 8 MB każdy."
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files))}
                />
                {files.length > 0 && (
                  <small>{files.map((f) => f.name).join(", ")}</small>
                )}
              </Field>
            ))}
          </div>
          {o.photos.length > 0 && (
            <p className="muted small">
              Zamówienie ma już {o.photos.length} zapisanych zdjęć.
            </p>
          )}
          <ErrorMessage error={error} />
        </div>
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Anuluj
          </Button>
          <Button loading={busy}>
            <Check size={17} /> Zapisz i powiadom klienta
          </Button>
        </div>
      </form>
    </Modal>
  );
}

createRoot(document.getElementById("root")).render(<App />);
