// ===== POO con HERENCIA =====
class EventItem {
  #registered = false;
  constructor(id, title, date, place) {
    this.id = id; this.title = title; this.date = date; this.place = place;
  }
  register(){ this.#registered = true; }
  cancel(){ this.#registered = false; }
  get registered(){ return this.#registered; }
}
/*Herencia ,ConcertEvent hereda todo lo que ya tenia EventItem*/ 
class ConcertEvent extends EventItem {
  constructor(id, title, date, place, artist, genre) {
    super(id, title, date, place);/*Llama al constructor del padre (EventItem)*/ 
    this.artist = artist; this.genre = genre;
  }/*Encapsulación con validación*/ 
  get artist(){ return this._artist; }
  set artist(v){ this._artist = (v || "").trim(); }/*elimina espacios el ev.artist */ 
  get genre(){ return this._genre; }
  set genre(v){ this._genre = (v || "").trim().toLowerCase(); }/*Siempre se guarde en minúscula*/ 
}
/*Usa getters y setters para validar datos antes de guardarlos.*/

// ===== FIX: evitar salto por href="#" ====

document.querySelectorAll('a[href="#"]').forEach(a =>
  a.addEventListener("click", e => e.preventDefault())
);

// ===== Helpers =====
/*Esta parte ayuda a buscar dentro de los elementos de manera mas rapida porque cita las partes 
cards-grid, la lista de eventos*/
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));
/*eventsMap va a buscar por id */ 
const eventsMap = new Map();
const registeredIds = new Set();
/*RegisterdIds va a guardar solo id registrados y no permite la duplicidad*/

/*Cada vez que haces click, lo haces una sola vez y lo guardas porque se guarda gracias al Dom*/ 
const cardsGrid = $(".cards-grid");
const myEventsList = $("#myEventsList");
const cardsSection = $(".cards");

const cards = $$(".cards-grid .card");
const searchInput = $("#searchInput");
const filterButtons = $$(".categories button");

let activeFilter = "all";/*Esto guarda el estado actual del filtro.*/ 

// Mensaje reggaetón
const noResultsMessage = document.createElement("p");/*Aqui crea un parrafo en memoria */ 
noResultsMessage.textContent = "Lo siento, aún no tenemos conciertos de reggaetón. Posiblemente despues"; /*Como reggaetón no esta en la lista entonces muestra un mensaje*/ 
/*Aqui le da estilo al mensaje y lo oculta por defecto. Solo se muestra si el filtro es reggaetón y no hay resultados*/
Object.assign(noResultsMessage.style, {
  textAlign: "center", marginTop: "20px", fontWeight: "600", display: "none"
});
/*Creación dinámica de un elemento del DOM que solo se mostrará bajo cierta condición.*/ 
cardsSection?.appendChild(noResultsMessage);
/*------------------------------------------------- */
// 1) Crear objetos desde el DOM + mostrar género visual
/*
HTML (vista) → Objetos POO (modelo) se conecta */
cards.forEach(card => {
  const id = card.dataset.id;
  /**Convierte cada card del HTML en un objeto ConcertEvent */
  /*Lee los datos del card del html*/
  const title = $(".card-title", card)?.textContent.trim() || "Evento";
  const date  = $(".card-date", card)?.textContent.trim() || "";
  const place = $(".card-meta", card)?.textContent.trim() || "";
  const artist = card.dataset.artist || title.split("-")[0] || title;
  const genre  = card.dataset.category || "all";
/**El HTML ya no es solo visual.
Ahora tienes una representación en memoria. */
  if (id) eventsMap.set(id, new ConcertEvent(id, title, date, place, artist, genre));

  const genreEl = $(".card-genre", card);
  if (genreEl) genreEl.textContent = `Género: ${(genre || "").toUpperCase()}`;
});

// UI card
function updateCardUI(card, isRegistered){
  const btn = $(".btn-register", card);
  if (!btn) return;
  card.classList.toggle("registered", isRegistered);
  btn.textContent = isRegistered ? "Cancelar" : "Registrarse";
}

// 2) Render “Mis eventos” lo que hace es recontruir la lista cada vez que hay un cambio. Es una forma sencilla de mantener todo sincronizado sin tener que manipular el DOM de forma individual para cada evento registrado o cancelado.
function renderMyEvents(){
//Si el contenedor no existe, se detiene
  if (!myEventsList) return;
  myEventsList.innerHTML = "";
//Esto borra todo y evista duplicados
  if (!registeredIds.size){
    const li = document.createElement("li");
    li.textContent = "Aún no tienes eventos registrados.";
    myEventsList.appendChild(li);
    return;
  }

  registeredIds.forEach(id => {
    const ev = eventsMap.get(id);
    if (!ev) return;

    const li = document.createElement("li");
    li.innerHTML = `
      <span>
        <strong>${ev.title}</strong><br>
        <small>${ev.date}</small><br>
        <small>${ev.artist} · ${ev.genre}</small>
      </span>
      <button type="button" data-cancel="${id}">Cancelar</button>
    `;
    myEventsList.appendChild(li);
  });
}

// 3) Registrar/Cancelar (cards)
cardsGrid?.addEventListener("click", e => {
  const btn = e.target.closest(".btn-register");
  if (!btn) return;

  const card = e.target.closest(".card");
  const id = card?.dataset.id;
  const ev = id ? eventsMap.get(id) : null;
  if (!card || !ev) return;

  const isReg = registeredIds.has(id);
  isReg ? (ev.cancel(), registeredIds.delete(id)) : (ev.register(), registeredIds.add(id));
  updateCardUI(card, !isReg);
  renderMyEvents();
});

// 4) Cancelar (Mis eventos)
myEventsList?.addEventListener("click", e => {
  const btn = e.target.closest("button[data-cancel]");
  if (!btn) return;

  const id = btn.dataset.cancel;
  const ev = eventsMap.get(id);
  if (!ev) return;

  ev.cancel();
  registeredIds.delete(id);

  const card = $(`.card[data-id="${id}"]`);
  if (card) updateCardUI(card, false);

  renderMyEvents();
});

// 5) Filtros + buscador
function applyFilters() {
  const q = (searchInput?.value || "").trim().toLowerCase();
  let visibleCount = 0;

  cards.forEach(card => {
    const category = (card.dataset.category || "").toLowerCase();
    const title  = $(".card-title", card)?.textContent.toLowerCase() || "";
    const meta   = $(".card-meta", card)?.textContent.toLowerCase() || "";
    const date   = $(".card-date", card)?.textContent.toLowerCase() || "";
    const artist = (card.dataset.artist || "").toLowerCase();

    const haystack = `${title} ${meta} ${date} ${artist} ${category}`;
    const show = (activeFilter === "all" || category === activeFilter) && (!q || haystack.includes(q));

    card.style.display = show ? "" : "none";
    if (show) visibleCount++;
  }); 

 if (activeFilter !== "all" && visibleCount === 0) {
  noResultsMessage.textContent = `Lo siento, aún no tenemos conciertos de ${activeFilter}.`;
  noResultsMessage.style.display = "block";
} else {
  noResultsMessage.style.display = "none";
}
}

filterButtons.forEach(btn => btn.addEventListener("click", () => {
  filterButtons.forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  activeFilter = (btn.dataset.filter || "all").toLowerCase();
  applyFilters();
}));

searchInput?.addEventListener("input", applyFilters);

// Inicial
renderMyEvents();
applyFilters();