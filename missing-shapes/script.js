const shapeState = {
  selectedMode: 'find_shape',
  difficulty: 'easy',
  score: 0,
  questionIndex: 0,
  correctCount: 0,
  questions: [],
  soundOn: true,
};

const shapeModes = {
  find_shape: {
    prompt: (question) => `Tap the ${question.item.name.toLowerCase()} shape.`,
    generator: () => {
      const item = randomItem(shapeList);
      const choices = shuffle([...shapeList.filter((shape) => shape.name !== item.name).slice(0, 3), item]);
      return { type: 'find_shape', item, choices, hint: `Look for the ${item.name.toLowerCase()} shape.` };
    },
  },
  pattern_match: {
    prompt: () => `Which shape comes next?`,
    generator: () => {
      const base = randomItem(shapeList);
      const next = randomItem(shapeList.filter((shape) => shape.name !== base.name));
      const sequence = [base, base, next];
      const choices = shuffle([...shapeList.filter((shape) => shape.name !== next.name).slice(0, 3), next]);
      return { type: 'pattern_match', sequence, next, choices, hint: `The next shape repeats the last one shown.` };
    },
  },
  count_shapes: {
    prompt: () => `How many of the same shape do you see?`,
    generator: () => {
      const item = randomItem(shapeList);
      const count = randomBetween(3, 6);
      const extra = randomBetween(2, 3);
      const total = count + extra;
      const display = Array.from({ length: total }, (_, idx) => idx < count ? item : randomItem(shapeList.filter((shape) => shape.name !== item.name)));
      const choices = shuffle([count, count + 1, count - 1, count + 2].map((n) => Math.max(1, n)).slice(0, 4));
      return { type: 'count_shapes', item, display, answer: count, choices, hint: `Only count the ${item.name.toLowerCase()} shapes.` };
    },
  },
};

const shapeList = [
  { name: 'Circle', render: () => `<div class="shape-shape" style="border-radius: 50%; background: linear-gradient(135deg, #ff9ffe, #fd78ff);"></div>` },
  { name: 'Square', render: () => `<div class="shape-shape" style="background: linear-gradient(135deg, #91d5ff, #61b8ff);"></div>` },
  { name: 'Triangle', render: () => `<div class="shape-shape" style="width: 0; height: 0; border-left: 40px solid transparent; border-right: 40px solid transparent; border-bottom: 80px solid #ffac58;"></div>` },
  { name: 'Star', render: () => `<svg class="shape-shape" viewBox="0 0 64 64" fill="#ffd37a"><polygon points="32 4 39 24 60 24 42 38 48 58 32 46 16 58 22 38 4 24 25 24"></polygon></svg>` },
  { name: 'Heart', render: () => `<svg class="shape-shape" viewBox="0 0 64 64" fill="#ff6fa2"><path d="M32 56s-24-13.35-24-32c0-10.15 8.15-18 18-18 6.7 0 11.9 3.75 14 9.15C44.1 9.75 49.3 6 56 6c9.85 0 18 7.85 18 18 0 18.65-24 32-24 32H32z"></path></svg>` },
];

const shapeEls = {
  shapeHome: document.getElementById('shapeHome'),
  shapeGame: document.getElementById('shapeGame'),
  shapeResult: document.getElementById('shapeResult'),
  startButton: document.getElementById('startButton'),
  scoreLabel: document.getElementById('scoreLabel'),
  starsDisplay: document.getElementById('starsDisplay'),
  roundLabel: document.getElementById('roundLabel'),
  promptText: document.getElementById('promptText'),
  shapePreview: document.getElementById('shapePreview'),
  answerGrid: document.getElementById('answerGrid'),
  hintArea: document.getElementById('hintArea'),
  hintText: document.getElementById('hintText'),
  soundToggle: document.getElementById('soundToggle'),
  hintButton: document.getElementById('hintButton'),
  restartButton: document.getElementById('restartButton'),
  homeButton: document.getElementById('homeButton'),
  playAgain: document.getElementById('playAgain'),
  backHome: document.getElementById('backHome'),
  resultTitle: document.getElementById('resultTitle'),
  resultText: document.getElementById('resultText'),
  finalScore: document.getElementById('finalScore'),
  resultStars: document.getElementById('resultStars'),
  confettiLayer: document.getElementById('confettiLayer'),
};

const shapeModeButtons = document.querySelectorAll('.shape-mode-btn');
const difficultyButtons = document.querySelectorAll('.difficulty-btn');

function initShapes() {
  shapeEls.soundToggle.addEventListener('click', toggleSound);
  shapeEls.hintButton.addEventListener('click', showHint);
  shapeEls.restartButton.addEventListener('click', () => startRound(true));
  shapeEls.homeButton.addEventListener('click', () => showShapeSection('home'));
  shapeEls.startButton.addEventListener('click', () => startRound(false));
  shapeEls.playAgain.addEventListener('click', () => startRound(false));
  shapeEls.backHome.addEventListener('click', () => showShapeSection('home'));

  shapeModeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      shapeModeButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      shapeState.selectedMode = button.dataset.mode;
    });
  });

  difficultyButtons.forEach((button) => {
    button.addEventListener('click', () => {
      difficultyButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      shapeState.difficulty = button.dataset.difficulty;
    });
  });

  shapeModeButtons[0].classList.add('active');
  showShapeSection('home');
}

function showShapeSection(section) {
  shapeEls.shapeHome.classList.remove('active');
  shapeEls.shapeGame.classList.remove('active');
  shapeEls.shapeResult.classList.remove('active');
  if (section === 'home') shapeEls.shapeHome.classList.add('active');
  if (section === 'game') shapeEls.shapeGame.classList.add('active');
  if (section === 'result') shapeEls.shapeResult.classList.add('active');
}

function startRound(forceRestart) {
  if (forceRestart || shapeState.questionIndex >= shapeState.questions.length || shapeState.questions.length === 0) {
    shapeState.score = 0;
    shapeState.correctCount = 0;
    shapeState.questionIndex = 0;
    shapeState.questions = Array.from({ length: 10 }, () => generateShapeQuestion());
  }
  showShapeSection('game');
  renderShapeQuestion();
}

function generateShapeQuestion() {
  const mode = shapeModes[shapeState.selectedMode];
  return mode.generator();
}

function renderShapeQuestion() {
  const current = shapeState.questions[shapeState.questionIndex];
  shapeEls.promptText.textContent = shapeModes[current.type].prompt(current);
  shapeEls.shapePreview.innerHTML = buildPreview(current);
  shapeEls.answerGrid.innerHTML = '';
  shapeEls.hintArea.classList.add('hidden');
  shapeEls.hintText.textContent = '';
  const choices = current.choices || [];
  choices.forEach((choice) => {
    const btn = document.createElement('button');
    btn.className = 'shape-option';
    if (typeof choice === 'object') {
      btn.innerHTML = `${choice.render()}<div>${choice.name}</div>`;
      btn.dataset.choice = choice.name;
    } else {
      btn.textContent = choice;
      btn.dataset.choice = String(choice);
    }
    btn.addEventListener('click', () => chooseShapeAnswer(choice, btn, current));
    shapeEls.answerGrid.appendChild(btn);
  });
  updateShapeStatus();
}

function buildPreview(current) {
  if (current.type === 'find_shape') {
    return current.item.render();
  }
  if (current.type === 'pattern_match') {
    return current.sequence.map((item) => `<div>${item.render()}</div>`).join('') + `<div class="shape-pattern-arrow">→</div><div class="shape-shape" style="width: 80px; height: 80px"></div>`;
  }
  if (current.type === 'count_shapes') {
    return `<div class="shape-display-grid">${current.display.map((shape) => shape.render()).join('')}</div>`;
  }
  return '';
}

function chooseShapeAnswer(choice, button, current) {
  // Determine expected key and selected key from DOM dataset to avoid object identity issues
  let expectedKey = null;
  if (current.type === 'count_shapes') expectedKey = String(current.answer);
  else if (current.type === 'pattern_match') expectedKey = (current.next && current.next.name) || null;
  else if (current.type === 'find_shape') expectedKey = (current.item && current.item.name) || null;
  else expectedKey = (current.item && current.item.name) || null;

  const selectedKey = button.dataset.choice || String(choice && choice.name || choice);
  const correct = expectedKey !== null && selectedKey === expectedKey;

  // Debugging log removed for production

  if (correct) {
    button.classList.add('correct');
    shapeState.score += 8;
    shapeState.correctCount += 1;
    playSound('correct');
  } else {
    button.classList.add('wrong');
    shapeState.score = Math.max(0, shapeState.score - 2);
    playSound('wrong');
  }

  // Immediately update score UI so user sees the change before next question
  updateShapeStatus();
  // Reveal the actual correct button for clarity
  Array.from(shapeEls.answerGrid.children).forEach((btn) => {
    btn.disabled = true;
    if (expectedKey && btn.dataset && btn.dataset.choice === expectedKey) {
      btn.classList.add('correct');
    }
  });
  setTimeout(() => {
    shapeState.questionIndex += 1;
    if (shapeState.questionIndex >= shapeState.questions.length) {
      finishShapeRound();
    } else {
      renderShapeQuestion();
    }
  }, 900);
}

function updateShapeStatus() {
  shapeEls.scoreLabel.textContent = shapeState.score;
  shapeEls.roundLabel.textContent = `${shapeState.questionIndex + 1} / 10`;
  shapeEls.starsDisplay.innerHTML = '';
  const stars = Math.min(3, Math.floor((shapeState.correctCount / 4) + 1));
  for (let i = 0; i < 3; i += 1) {
    const span = document.createElement('span');
    span.textContent = '★';
    if (i < stars) span.classList.add('star-filled');
    shapeEls.starsDisplay.appendChild(span);
  }
}

function finishShapeRound() {
  const starAmount = Math.min(3, Math.max(1, Math.round((shapeState.correctCount / 10) * 3)));
  shapeEls.finalScore.textContent = shapeState.score;
  shapeEls.resultStars.innerHTML = '';
  for (let i = 0; i < 3; i += 1) {
    const span = document.createElement('span');
    span.textContent = '★';
    if (i < starAmount) span.classList.add('star-filled');
    shapeEls.resultStars.appendChild(span);
  }
  shapeEls.resultTitle.textContent = starAmount >= 2 ? 'Fantastic work!' : 'Nice try!';
  shapeEls.resultText.textContent = starAmount === 3
    ? 'You spotted every shape and pattern perfectly!'
    : starAmount === 2
      ? 'Great pattern power and shape spotting!' 
      : 'Good effort — try again and earn more stars!';
  if (starAmount >= 2) popConfetti();
  showShapeSection('result');
}

function showHint() {
  const current = shapeState.questions[shapeState.questionIndex];
  if (!current) return;
  shapeEls.hintArea.classList.remove('hidden');
  shapeEls.hintText.textContent = current.hint;
}

function toggleSound() {
  shapeState.soundOn = !shapeState.soundOn;
  shapeEls.soundToggle.textContent = shapeState.soundOn ? '🔊' : '🔇';
}

function playSound(type) {
  if (!shapeState.soundOn) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = 'triangle';
    oscillator.frequency.value = type === 'correct' ? 720 : 280;
    gain.gain.value = 0.12;
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.12);
    oscillator.onended = () => ctx.close();
  } catch (err) {
    // Ignore audio failures.
  }
}

function popConfetti() {
  const count = 18;
  const layer = shapeEls.confettiLayer;
  layer.innerHTML = '';
  for (let i = 0; i < count; i += 1) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.color = ['#ff97c2', '#77e3ff', '#ffa752', '#c37cff'][i % 4];
    piece.style.left = `${randomBetween(5, 95)}%`;
    piece.style.top = `${randomBetween(0, 20)}%`;
    layer.appendChild(piece);
    setTimeout(() => {
      piece.style.transition = 'transform 1.4s ease-out, opacity 1.4s ease-out';
      piece.style.opacity = '1';
      piece.style.transform = `translate(${randomBetween(-50, 50)}px, ${randomBetween(130, 280)}px) rotate(${randomBetween(90, 360)}deg)`;
    }, Math.random() * 300);
  }
  setTimeout(() => { layer.innerHTML = ''; }, 1800);
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

window.addEventListener('DOMContentLoaded', initShapes);
