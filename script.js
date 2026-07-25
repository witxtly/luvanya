
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB11JPovWBb5mAvSwQecxf0_Fws3g4uJis",
  authDomain: "anya-bd.firebaseapp.com",
  projectId: "anya-bd",
  storageBucket: "anya-bd.firebasestorage.app",
  messagingSenderId: "632644439588",
  appId: "1:632644439588:web:a21d4b585dc407681252b1",
  measurementId: "G-NP3STD7L9E"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


async function loadDoc(docId) {
  const ref = doc(db, 'anya', docId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

async function saveDoc(docId, data) {
  const ref = doc(db, 'anya', docId);
  await setDoc(ref, data);
}


const modal = document.createElement('div');
modal.className = 'modal-overlay';
modal.innerHTML = `
  <div class="modal">
    <button class="modal-close">✕</button>
    <div class="modal-gift-name"></div>

    <div class="modal-section-label">Твоя оценка</div>
    <div class="modal-stars">
      <span data-val="1">★</span>
      <span data-val="2">★</span>
      <span data-val="3">★</span>
      <span data-val="4">★</span>
      <span data-val="5">★</span>
    </div>

    <div class="modal-section-label">Отзыв</div>
    <textarea class="modal-textarea" placeholder="Напиши что думаешь об этом подарке..."></textarea>

    <button class="modal-save">Сохранить</button>
    <div class="modal-locked-msg">Отзыв уже оставлен и не может быть изменён ✓</div>
  </div>
`;
document.body.appendChild(modal);

let currentGiftIndex = null;
let selectedRating = 0;

function openModal(index, name, giftData) {
  currentGiftIndex = index;
  selectedRating = 0;

  const locked = !!giftData?.locked;

  modal.querySelector('.modal-gift-name').textContent = name;
  modal.querySelector('.modal-textarea').value = giftData?.review || '';
  modal.querySelector('.modal-textarea').disabled = locked;

  modal.querySelector('.modal-save').style.display = locked ? 'none' : 'block';
  modal.querySelector('.modal-locked-msg').style.display = locked ? 'block' : 'none';

  setStars(giftData?.rating || 0, locked);

  modal.classList.add('active');
}

function closeModal() {
  modal.classList.remove('active');
  currentGiftIndex = null;
}

function setStars(rating, locked) {
  selectedRating = rating;

  modal.querySelectorAll('.modal-stars span').forEach((s, i) => {
    s.classList.toggle('active', i < rating);
    s.style.pointerEvents = locked ? 'none' : 'auto';
  });
}

modal.querySelectorAll('.modal-stars span').forEach(star => {

  star.addEventListener('mouseenter', () => {
    if (modal.querySelector('.modal-textarea').disabled) return;

    const val = +star.dataset.val;

    modal.querySelectorAll('.modal-stars span').forEach((s, i) => {
      s.classList.toggle('hover', i < val);
    });
  });

  modal.querySelector('.modal-stars').addEventListener('mouseleave', () => {
    modal.querySelectorAll('.modal-stars span').forEach(s => s.classList.remove('hover'));
  });

  star.addEventListener('click', () => {
    if (modal.querySelector('.modal-textarea').disabled) return;
    setStars(+star.dataset.val, false);
  });

});

modal.querySelector('.modal-save').addEventListener('click', async () => {

  if (currentGiftIndex === null) return;

  if (!selectedRating) {
    alert('Поставь оценку!');
    return;
  }

  const review = modal.querySelector('.modal-textarea').value.trim();

  const saveBtn = modal.querySelector('.modal-save');
  saveBtn.textContent = 'Сохраняю...';
  saveBtn.disabled = true;

  const existing = await loadDoc(`gift_${currentGiftIndex}`);

  if (existing?.locked) {

    alert('Этот отзыв уже сохранён.');

    giftsCache[currentGiftIndex] = existing;
    updateGiftCard(currentGiftIndex, existing);

    closeModal();

    saveBtn.textContent = 'Сохранить';
    saveBtn.disabled = false;

    return;
  }

  const data = {
    rating: selectedRating,
    review: review,
    locked: true
  };

  await saveDoc(`gift_${currentGiftIndex}`, data);

  giftsCache[currentGiftIndex] = data;

  updateGiftCard(currentGiftIndex, data);

  closeModal();

  saveBtn.textContent = 'Сохранить';
  saveBtn.disabled = false;

});

modal.querySelector('.modal-close').addEventListener('click', closeModal);

modal.addEventListener('click', e => {
  if (e.target === modal) closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});


function updateGiftCard(index, gift) {

  const card = document.querySelectorAll('.gift')[index];
  if (!card) return;

  const ratingEl = card.querySelector('.rating');

  if (ratingEl) {
    ratingEl.innerHTML = [1,2,3,4,5].map(i =>
      `<span style="color:${i <= (gift?.rating || 0) ? 'var(--pink)' : '#333'}">★</span>`
    ).join('');
  }

  let badge = card.querySelector('.reviewed-badge');

  if (gift?.locked) {

    if (!badge) {

      badge = document.createElement('div');
      badge.className = 'reviewed-badge';
      badge.textContent = '✓';

      card.appendChild(badge);

    }

  } else {

    badge?.remove();

  }

}

const giftsCache = {};

document.querySelectorAll('.gift').forEach((card, index) => {

  const name =
    card.querySelector('h3')?.innerText.replace(/\n/g, ' ') ||
    `Подарок ${index + 1}`;

  loadDoc(`gift_${index}`).then(data => {

    giftsCache[index] = data;

    updateGiftCard(index, data);

  });

  card.addEventListener('click', async () => {


    const latest = await loadDoc(`gift_${index}`);

    giftsCache[index] = latest;

    openModal(index, name, latest || null);

  });

});


(async function initFuture() {
  const textarea = document.querySelector('.inputmesseg input');
  const btn = document.querySelector('.buttonfuture button');
  const charCount = document.querySelector('.char-count');
  if (!textarea || !btn) return;

  const data = await loadDoc('future');

  if (data?.locked) {
    textarea.value = data.text;
    textarea.disabled = true;
    btn.textContent = '✓ Послание запечатано';
    btn.disabled = true;
    btn.style.opacity = '0.5';
    return;
  }

  textarea.addEventListener('input', () => {
    const len = textarea.value.length;
    if (charCount) charCount.textContent = `${len}/500`;
    if (len > 500) textarea.value = textarea.value.slice(0, 500);
  });

  btn.addEventListener('click', async () => {
    const text = textarea.value.trim();
    if (!text) { alert('Напиши что-нибудь!'); return; }
    if (!confirm('После сохранения изменить послание будет нельзя. Уверена?')) return;

    btn.textContent = 'Сохраняю...';
    btn.disabled = true;

    await saveDoc('future', { text, locked: true });

    textarea.disabled = true;
    btn.textContent = '✓ Послание запечатано';
    btn.style.opacity = '0.5';
  });
})();

(async function initBestGift() {
  const input = document.querySelector('.inputmessegGift input');
  const btn = document.querySelector('.buttonGift button');
  if (!input || !btn) return;

  const data = await loadDoc('bestGift');

  if (data?.locked) {
    input.value = data.name;
    input.disabled = true;
    btn.textContent = '✓ Выбор сохранён';
    btn.disabled = true;
    btn.style.opacity = '0.5';
    return;
  }

  btn.addEventListener('click', async () => {
    const name = input.value.trim();
    if (!name) { alert('Напиши название подарка!'); return; }
    if (!confirm('После сохранения изменить выбор будет нельзя. Уверена?')) return;

    btn.textContent = 'Сохраняю...';
    btn.disabled = true;

    await saveDoc('bestGift', { name, locked: true });

    input.disabled = true;
    btn.textContent = '✓ Выбор сохранён';
    btn.style.opacity = '0.5';
  });
})();



document.addEventListener("copy", e => e.preventDefault());
document.addEventListener("cut", e => e.preventDefault());
document.addEventListener("selectstart", e => e.preventDefault());
document.addEventListener("dragstart", e => e.preventDefault());
document.addEventListener("contextmenu", e => e.preventDefault());


const photos = Array.from({length:20}, (_,i)=>({
  src:`img/photo${i+1}.jpg`,
  caption:`${i+1}`
}));

const gallery = document.getElementById('gallery');
photos.forEach((p)=>{
  const slot = document.createElement('div');
  slot.className = 'polaroid-slot';
  const tilt = (Math.random()*6-3).toFixed(1);
  slot.innerHTML = `
    <div class="string-drop"></div>
    <div class="clip"></div>
    <div class="polaroid" style="--tilt:${tilt}deg">
      <div class="photo" style="background-image:url('${p.src}')"></div>
      <div class="caption">ㅤ</div>
    </div>
  `;
  gallery.appendChild(slot);
});

const svg = document.querySelector('.lights-wrap svg');
const wire = document.getElementById('wire');
const len = wire.getTotalLength();
const bulbCount = 18;
const colors = ['#e8437a','#ffcb7d','#ffd9a0'];
for(let i=0;i<bulbCount;i++){
  const pt = wire.getPointAtLength((len/(bulbCount-1))*i);
  const c = document.createElementNS("http://www.w3.org/2000/svg","circle");
  c.setAttribute("cx", pt.x);
  c.setAttribute("cy", pt.y+6);
  c.setAttribute("r", 5);
  c.setAttribute("fill", colors[i%colors.length]);
  c.setAttribute("class","bulb");
  c.style.animationDelay = (Math.random()*2)+"s";
  svg.appendChild(c);
}
