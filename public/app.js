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
const toast = document.querySelector('#toast');

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
    const response = await fetch('/api/prizes');
    if (!response.ok) throw new Error('Không tải được danh sách quà.');
    const data = await response.json();
    if (!Array.isArray(data.prizes) || data.prizes.length < 2) throw new Error('Danh sách quà chưa sẵn sàng.');
    renderPrizes(data.prizes);
  } catch (error) {
    formMessage.textContent = error.message;
    spinButton.disabled = true;
  }
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
    const response = await fetch('/api/spin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Không thể thực hiện lượt quay.');

    await animateToPrize(data.prizeIndex);
    winnerPrize.textContent = data.prize.name;
    entryContent.hidden = true;
    winnerContent.hidden = false;
  } catch (error) {
    formMessage.textContent = error.message;
    if (error.message.includes('đã được sử dụng')) showToast('Mỗi mã chỉ dùng được một lần.');
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

loadPrizes();