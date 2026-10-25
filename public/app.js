const appRoot = document.querySelector('#app');
if (appRoot && !appRoot.querySelector('#wheel')) {
  appRoot.innerHTML = `
    <div class="page-shell">
      <header class="topbar">
        <a class="brand" href="./" aria-label="Vòng quay may mắn">
          <span class="brand-mark" aria-hidden="true"><span></span></span>
          <span class="brand-name">MAY MẮN<span class="brand-period">.</span></span>
        </a>
        <div class="campaign-status"><span class="live-dot"></span> CHƯƠNG TRÌNH ĐANG MỞ</div>
      </header>
      <main>
        <section class="intro" aria-labelledby="page-title">
          <p class="eyebrow"><span class="eyebrow-line"></span> MỘT CHÚT MAY MẮN, MỘT NIỀM VUI</p>
          <h1 id="page-title">Vòng quay<br><span>may mắn.</span></h1>
          <p class="intro-copy">Món quà nhỏ đang chờ bạn. Nhập mã riêng để bắt đầu nhé!</p>
        </section>
        <section class="game-layout" aria-label="Trò chơi vòng quay">
          <div class="wheel-column">
            <div class="wheel-caption"><span class="caption-mark"></span> VÒNG QUAY CỦA BẠN</div>
            <div class="wheel-wrap">
              <div class="wheel-shadow" aria-hidden="true"></div>
              <div class="wheel-pointer" aria-hidden="true"><span></span></div>
              <div class="wheel-rim">
                <div class="wheel" id="wheel" aria-label="Vòng quay quà tặng">
                  <div class="wheel-labels" id="wheel-labels"></div>
                  <div class="wheel-hub"><span class="hub-spark" aria-hidden="true">✦</span></div>
                </div>
              </div>
              <span class="orbit orbit-one" aria-hidden="true"></span>
              <span class="orbit orbit-two" aria-hidden="true"></span>
            </div>
            <p class="wheel-footnote"><span aria-hidden="true">✳</span> Mỗi mã có một lượt trên trình duyệt này</p>
          </div>
          <aside class="entry-panel" aria-labelledby="entry-title">
            <div class="panel-topline"><span class="panel-index">01</span><span>NHẬP MÃ THAM GIA</span></div>
            <div class="panel-content" id="entry-content">
              <h2 id="entry-title">Sẵn sàng<br>thử vận may?</h2>
              <p class="panel-copy">Mã quay được gửi riêng cho bạn. Nhập mã để mở lượt quay.</p>
              <form id="spin-form" novalidate>
                <label for="code-input">MÃ CỦA BẠN</label>
                <div class="input-wrap">
                  <span class="input-spark" aria-hidden="true">✳</span>
                  <input id="code-input" name="code" type="text" placeholder="VD: LUCKY-2026-001" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="40" required>
                </div>
                <p class="form-message" id="form-message" role="status" aria-live="polite"></p>
                <button class="spin-button" id="spin-button" type="submit"><span>Quay ngay</span><span class="button-arrow" aria-hidden="true">↗</span></button>
              </form>
              <div class="prize-summary">
                <div class="summary-heading"><span>QUÀ ĐANG CHỜ</span><span class="summary-count" id="prize-count">—</span></div>
                <ul class="prize-list" id="prize-list" aria-label="Danh sách phần quà"></ul>
              </div>
              <button class="export-button" id="export-results" type="button"><span aria-hidden="true">↓</span> Tải kết quả JSON</button>
            </div>
            <div class="winner-content" id="winner-content" hidden aria-live="polite">
              <span class="winner-stamp" aria-hidden="true">✦</span>
              <p class="winner-label">KẾT QUẢ CỦA BẠN</p>
              <h2 id="winner-title">Bạn nhận được</h2>
              <p class="winner-prize" id="winner-prize"></p>
              <p class="winner-note">Kết quả được lưu trên trình duyệt này. Hãy tải JSON để lưu lại.</p>
              <button class="reset-button" id="reset-button" type="button">Đóng kết quả</button>
            </div>
          </aside>
        </section>
        <footer class="page-footer">
          <span>CHÚC BẠN CÓ MỘT NGÀY THẬT VUI</span><span class="footer-sun" aria-hidden="true">✳</span><span>01 MÃ <i>·</i> 01 LƯỢT QUAY</span>
        </footer>
      </main>
    </div>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>`;
}

const wheel = document.querySelector('#wheel');
const wheelLabels = document.querySelector('#wheel-labels');
const prizeList = document.querySelector('#prize-list');
const prizeCount = document.querySelector('#prize-count');
const spinForm = document.querySelector('#spin-form');
const codeInput = document.querySelector('#code-input');
const spinButton = document.querySelector('#spin-button');
const formMessage = document.querySelector('#form-message');
const entryContent = document.querySelector('#entry-content');
const winnerContent = document.querySelector('#winner-content');
const winnerPrize = document.querySelector('#winner-prize');
const resetButton = document.querySelector('#reset-button');
const exportButton = document.querySelector('#export-results');
const toast = document.querySelector('#toast');

const storageKey = 'zalo-lucky-wheel-store-v1';
let store;
let prizes = [];
let currentRotation = 0;
let spinning = false;
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2600);
}

function renderPrizes(items) {
  prizes = items;
  const step = 360 / prizes.length;
  const stops = prizes.map((prize, index) => `${prize.color} ${index * step}deg ${(index + 1) * step}deg`);
  wheel.style.background = `conic-gradient(from -90deg, ${stops.join(', ')})`;
  wheelLabels.replaceChildren();
  prizeList.replaceChildren();
  prizeCount.textContent = String(prizes.length).padStart(2, '0');

  prizes.forEach((prize, index) => {
    const label = document.createElement('span');
    label.className = 'wheel-label';
    label.textContent = prize.name;
    label.style.transform = `translate(-50%, -50%) rotate(${(index + 0.5) * step}deg) translateY(calc(var(--wheel-size) * -0.34)) rotate(90deg)`;
    wheelLabels.append(label);

    const item = document.createElement('li');
    const swatch = document.createElement('span');
    swatch.className = 'prize-swatch';
    swatch.style.backgroundColor = prize.color;
    const name = document.createElement('span');
    name.textContent = prize.name;
    item.append(swatch, name);
    prizeList.append(item);
  });
}

async function loadPrizes() {
  try {
    const response = await fetch(new URL('./data/store.json', window.location.href));
    if (!response.ok) throw new Error('Không tải được cấu hình quà.');
    const initialStore = await response.json();
    if (!Array.isArray(initialStore.prizes) || initialStore.prizes.length < 2 || !Array.isArray(initialStore.codes)) {
      throw new Error('Cấu hình vòng quay chưa hợp lệ.');
    }

    store = loadSavedStore(initialStore);
    saveStore();
    prizes = store.prizes;
    renderPrizes(prizes);
  } catch (error) {
    formMessage.textContent = `${error.message} Mở ứng dụng qua GitHub Pages hoặc Live Server.`;
    spinButton.disabled = true;
  }
}

function loadSavedStore(initialStore) {
  const savedValue = localStorage.getItem(storageKey);
  if (!savedValue) return initialStore;

  try {
    const savedStore = JSON.parse(savedValue);
    if (!Array.isArray(savedStore.codes) || !Array.isArray(savedStore.spins)) return initialStore;

    const savedCodes = new Map(savedStore.codes.map((entry) => [entry.code.toUpperCase(), entry]));
    initialStore.codes = initialStore.codes.map((entry) => {
      const savedEntry = savedCodes.get(entry.code.toUpperCase());
      return savedEntry && savedEntry.usedAt ? { ...entry, usedAt: savedEntry.usedAt, prizeId: savedEntry.prizeId } : entry;
    });

    const spinsByCode = new Map(initialStore.spins.map((spin) => [spin.code.toUpperCase(), spin]));
    savedStore.spins.forEach((spin) => spinsByCode.set(spin.code.toUpperCase(), spin));
    initialStore.spins = Array.from(spinsByCode.values());
  } catch {
    localStorage.removeItem(storageKey);
  }

  return initialStore;
}

function saveStore() {
  localStorage.setItem(storageKey, JSON.stringify(store));
}

function choosePrizeIndex() {
  const totalWeight = prizes.reduce((sum, prize) => sum + Math.max(0, Number(prize.weight) || 0), 0);
  if (!Number.isSafeInteger(totalWeight) || totalWeight <= 0) throw new Error('Cấu hình trọng số quà không hợp lệ.');

  let ticket = Math.random() * totalWeight;
  for (let index = 0; index < prizes.length; index += 1) {
    ticket -= Math.max(0, Number(prizes[index].weight) || 0);
    if (ticket < 0) return index;
  }
  return prizes.length - 1;
}

function animateToPrize(index) {
  const step = 360 / prizes.length;
  const desiredRotation = -((index + 0.5) * step);
  const offset = ((desiredRotation - (currentRotation % 360)) % 360 + 360) % 360;
  currentRotation += 360 * 6 + offset;
  wheel.style.transform = `rotate(${currentRotation}deg)`;

  return new Promise((resolve) => {
    const onFinish = (event) => {
      if (event.propertyName !== 'transform') return;
      wheel.removeEventListener('transitionend', onFinish);
      resolve();
    };
    wheel.addEventListener('transitionend', onFinish);
    window.setTimeout(resolve, 6000);
  });
}

spinForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (spinning) return;

  const code = codeInput.value.trim().toUpperCase();
  formMessage.textContent = '';
  if (!/^[A-Z0-9-]{4,40}$/.test(code)) {
    formMessage.textContent = 'Mã cần có từ 4 đến 40 ký tự chữ, số hoặc dấu gạch ngang.';
    codeInput.focus();
    return;
  }

  spinning = true;
  spinButton.disabled = true;
  spinButton.querySelector('span:first-child').textContent = 'Đang quay...';

  try {
    const codeEntry = store.codes.find((entry) => entry.code.toUpperCase() === code);
    if (!codeEntry) throw new Error('Mã không tồn tại. Hãy kiểm tra lại nhé.');
    if (codeEntry.usedAt) throw new Error('Mã này đã được sử dụng trên trình duyệt này.');

    const prizeIndex = choosePrizeIndex();
    const prize = prizes[prizeIndex];
    const spunAt = new Date().toISOString();
    codeEntry.usedAt = spunAt;
    codeEntry.prizeId = prize.id;
    store.spins.push({ code: codeEntry.code, prize: prize.name, prizeId: prize.id, spunAt });
    saveStore();

    await animateToPrize(prizeIndex);
    winnerPrize.textContent = prize.name;
    entryContent.hidden = true;
    winnerContent.hidden = false;
  } catch (error) {
    formMessage.textContent = error.message;
    if (error.message.includes('đã được sử dụng')) showToast('Mã này đã quay trên trình duyệt này.');
    spinButton.disabled = false;
  } finally {
    spinning = false;
    spinButton.querySelector('span:first-child').textContent = 'Quay ngay';
  }
});

resetButton.addEventListener('click', () => {
  winnerContent.hidden = true;
  entryContent.hidden = false;
  codeInput.value = '';
  formMessage.textContent = '';
  spinButton.disabled = false;
  codeInput.focus();
});

exportButton.addEventListener('click', () => {
  if (!store) return;
  const exportData = {
    exportedAt: new Date().toISOString(),
    spins: store.spins
  };
  const downloadUrl = URL.createObjectURL(new Blob([`${JSON.stringify(exportData, null, 2)}\n`], { type: 'application/json' }));
  const downloadLink = document.createElement('a');
  downloadLink.href = downloadUrl;
  downloadLink.download = 'vong-quay-ket-qua.json';
  downloadLink.click();
  URL.revokeObjectURL(downloadUrl);
});

loadPrizes();