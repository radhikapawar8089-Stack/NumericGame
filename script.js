import { db } from './firebase-config.js';

const appState = {
  currentScreen: 'home',
  selectedMode: null,
  difficulty: 'easy',
  score: 0,
  level: 1,
  questionIndex: 0,
  correctCount: 0,
  questions: [],
  soundOn: true,
  hintUsed: false,
};

const gameModes = {
  missing_1_20: {
    title: 'Missing number 1–20',
    description: 'Find the missing number in a simple sequence.',
    question: () => {
      const start = randomBetween(1, 16);
      const missingIndex = randomBetween(0, 2);
      const values = [start, start + 1, start + 2, start + 3];
      const answer = values[missingIndex];
      const items = values.map((n, index) => index === missingIndex ? '...' : n);
      return {
        prompt: 'Which number is missing?',
        display: items.join('  '),
        answer,
        hint: `Look at the pattern of numbers in order.`,
      };
    },
  },
  missing_1_50: {
    title: 'Missing number 1–50',
    description: 'Fill the blank in a bright counting row.',
    question: () => {
      const start = randomBetween(2, 45);
      const missingIndex = randomBetween(0, 2);
      const values = [start, start + 1, start + 2, start + 3];
      const answer = values[missingIndex];
      const items = values.map((n, index) => index === missingIndex ? '...' : n);
      return {
        prompt: 'Spot the missing number:',
        display: items.join('  '),
        answer,
        hint: `Count forward and fill the blank.`,
      };
    },
  },
  missing_1_100: {
    title: 'Missing number 1–100',
    description: 'Challenge your number sense with bigger values.',
    question: () => {
      const start = randomBetween(5, 90);
      const missingIndex = randomBetween(0, 2);
      const values = [start, start + 1, start + 2, start + 3];
      const answer = values[missingIndex];
      const items = values.map((n, index) => index === missingIndex ? '...' : n);
      return {
        prompt: 'Which number should fill the blank?',
        display: items.join('  '),
        answer,
        hint: `This is a counting sequence with one number missing.`,
      };
    },
  },
  greater_than: {
    title: 'Greater than',
    description: 'Choose the larger number.',
    question: () => {
      const pivot = randomBetween(1, 75);
      const answer = randomBetween(pivot + 1, pivot + 20);
      return {
        mode: 'greater_than',
        prompt: `Pick the number > ${pivot}:`,
        display: '',
        answer,
        pivot,
        hint: `Choose the number that is greater than ${pivot}.`,
      };
    },
  },
  less_than: {
    title: 'Less than',
    description: 'Pick the smaller number.',
    question: () => {
      const pivot = randomBetween(11, 95);
      const answer = randomBetween(Math.max(1, pivot - 20), pivot - 1);
      return {
        mode: 'less_than',
        prompt: `Pick the number < ${pivot}:`,
        display: '',
        answer,
        pivot,
        hint: `Choose the number that is less than ${pivot}.`,
      };
    },
  },
  between_numbers: {
    title: 'Between numbers',
    description: 'Find the number that fits in between.',
    question: () => {
      const start = randomBetween(1, 70);
      const end = randomBetween(start + 3, start + 10);
      const answer = randomBetween(start + 1, end - 1);
      return {
        mode: 'between_numbers',
        prompt: `Pick the number ${start} < ? < ${end}:`,
        display: '',
        answer,
        start,
        end,
        hint: `Choose a number between ${start} and ${end}.`,
      };
    },
  },
};

const difficultySettings = {
  easy: { optionCount: 4, extraRange: 8 },
  medium: { optionCount: 5, extraRange: 14 },
  hard: { optionCount: 6, extraRange: 22 },
};

const elements = {
  homeScreen: document.getElementById('homeScreen'),
  selectionScreen: document.getElementById('selectionScreen'),
  gameScreen: document.getElementById('gameScreen'),
  resultScreen: document.getElementById('resultScreen'),
  startNumbers: document.getElementById('startNumbers'),
  startGameButton: document.getElementById('startGameButton'),
  questionPrompt: document.getElementById('questionPrompt'),
  questionDetail: document.getElementById('questionDetail'),
  optionsGrid: document.getElementById('optionsGrid'),
  questionTracker: document.getElementById('questionTracker'),
  progressFill: document.getElementById('progressFill'),
  scoreLabel: document.getElementById('scoreLabel'),
  levelLabel: document.getElementById('levelLabel'),
  starDisplay: document.getElementById('starDisplay'),
  hintPanel: document.getElementById('hintPanel'),
  hintText: document.getElementById('hintText'),
  soundToggle: document.getElementById('soundToggle'),
  hintButton: document.getElementById('hintButton'),
  restartButton: document.getElementById('restartButton'),
  homeButton: document.getElementById('homeButton'),
  resultMessage: document.getElementById('resultMessage'),
  finalScore: document.getElementById('finalScore'),
  finalStars: document.getElementById('finalStars'),
  playAgainButton: document.getElementById('playAgainButton'),
  goHomeButton: document.getElementById('goHomeButton'),
  confettiLayer: document.getElementById('confettiLayer'),
};

const difficultyButtons = document.querySelectorAll('.difficulty-btn');
const modeButtons = document.querySelectorAll('.mode-btn');

function init() {
  const onShapesPage = !!document.getElementById('shapeHome');
  if (onShapesPage) {
    if (window.location.pathname === '/missing-shapes') {
      window.location.replace('/missing-shapes/index.html');
    }
    return;
  }

  elements.homeButton.addEventListener('click', () => showSection('home'));
  elements.startNumbers.addEventListener('click', (event) => {
    event.preventDefault();
    showSection('selection');
  });
  elements.startGameButton.addEventListener('click', beginRound);
  elements.soundToggle.addEventListener('click', toggleSound);
  elements.hintButton.addEventListener('click', showHint);
  elements.restartButton.addEventListener('click', restartRound);
  elements.playAgainButton.addEventListener('click', beginRound);
  elements.goHomeButton.addEventListener('click', () => showSection('home'));

  difficultyButtons.forEach((button) => {
    button.addEventListener('click', () => {
      difficultyButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      appState.difficulty = button.dataset.difficulty;
    });
  });

  modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      modeButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      appState.selectedMode = button.dataset.mode;
    });
  });

  showSection('home');
}

function showSection(screen) {
  appState.currentScreen = screen;
  Object.values(elements).forEach((el) => {
    if (el && el.classList && el.classList.contains('screen')) {
      el.classList.remove('active');
    }
  });
  if (screen === 'home') {
    elements.homeScreen.classList.add('active');
  } else if (screen === 'selection') {
    elements.selectionScreen.classList.add('active');
  } else if (screen === 'game') {
    elements.gameScreen.classList.add('active');
  } else if (screen === 'result') {
    elements.resultScreen.classList.add('active');
  }
}

function beginRound() {
  if (!appState.selectedMode) {
    alert('Please choose a puzzle to start.');
    return;
  }
  appState.score = 0;
  appState.correctCount = 0;
  appState.questionIndex = 0;
  appState.hintUsed = false;
  appState.questions = Array.from({ length: 10 }, () => gameModes[appState.selectedMode].question());
  showSection('game');
  updateStats();
  renderQuestion();
}

function restartRound() {
  if (appState.currentScreen !== 'game') {
    beginRound();
    return;
  }
  beginRound();
}

function updateStats() {
  elements.scoreLabel.textContent = appState.score;
  elements.levelLabel.textContent = appState.level;
  elements.questionTracker.textContent = `Question ${appState.questionIndex + 1} / 10`;
  const progress = ((appState.questionIndex) / 10) * 100;
  elements.progressFill.style.width = `${progress}%`;
  renderStars();
}

function renderStars() {
  const stars = Math.min(3, Math.floor((appState.correctCount / 4) + 1));
  elements.starDisplay.innerHTML = '';
  for (let i = 0; i < 3; i += 1) {
    const star = document.createElement('span');
    star.textContent = '★';
    if (i < stars) star.classList.add('star-filled');
    elements.starDisplay.appendChild(star);
  }
}

function renderQuestion() {
  const current = appState.questions[appState.questionIndex];
  elements.questionPrompt.textContent = current.prompt;
  elements.questionDetail.textContent = current.display;
  elements.hintPanel.classList.add('hidden');
  elements.hintText.textContent = '';
  const choices = createOptions(current);
  elements.optionsGrid.innerHTML = '';
  choices.forEach((choice) => {
    const button = document.createElement('button');
    button.className = 'option-tile';
    button.textContent = choice;
    button.addEventListener('click', () => handleAnswer(choice, button, current));
    elements.optionsGrid.appendChild(button);
  });
  updateStats();
}

function createOptions(question) {
  const { optionCount } = difficultySettings[appState.difficulty];
  const answers = new Set([question.answer]);
  const rangeSize = difficultySettings[appState.difficulty].extraRange;

  while (answers.size < optionCount) {
    let candidate;

    if (question.mode === 'greater_than') {
      candidate = randomBetween(1, question.pivot);
    } else if (question.mode === 'less_than') {
      candidate = randomBetween(question.pivot, question.pivot + rangeSize);
    } else if (question.mode === 'between_numbers') {
      const lowChoice = randomBetween(1, question.start);
      const highChoice = randomBetween(question.end, question.end + rangeSize);
      candidate = Math.random() > 0.5 ? lowChoice : highChoice;
    } else {
      candidate = question.answer + randomBetween(-rangeSize, rangeSize);
      if (candidate < 1) candidate = Math.abs(candidate) + 1;
    }

    if (question.mode === 'greater_than' && candidate <= question.pivot) {
      answers.add(candidate);
    } else if (question.mode === 'less_than' && candidate >= question.pivot) {
      answers.add(candidate);
    } else if (question.mode === 'between_numbers' && (candidate <= question.start || candidate >= question.end)) {
      answers.add(candidate);
    } else if (!question.mode) {
      answers.add(candidate);
    }
  }

  return shuffle(Array.from(answers));
}

function handleAnswer(choice, tile, question) {
  const correct = Number(choice) === question.answer;
  if (correct) {
    tile.classList.add('correct');
    appState.score += 10;
    appState.correctCount += 1;
    playSound('correct');
    showToast('Great job!');
  } else {
    tile.classList.add('wrong');
    appState.score = Math.max(0, appState.score - 3);
    playSound('wrong');
    showToast('Try the next one!');
  }
  Array.from(elements.optionsGrid.children).forEach((button) => {
    button.disabled = true;
    if (Number(button.textContent) === question.answer) {
      button.classList.add('correct');
    }
  });
  setTimeout(() => {
    appState.questionIndex += 1;
    if (appState.questionIndex >= appState.questions.length) {
      endRound();
    } else {
      renderQuestion();
    }
  }, 900);
}

function endRound() {
  appState.level += 1;
  showSection('result');
  elements.finalScore.textContent = appState.score;
  const starQuality = Math.min(3, Math.max(1, Math.round((appState.correctCount / 10) * 3)));
  elements.finalStars.innerHTML = '';
  for (let i = 0; i < 3; i += 1) {
    const star = document.createElement('span');
    star.textContent = '★';
    if (i < starQuality) star.classList.add('star-filled');
    elements.finalStars.appendChild(star);
  }
  elements.resultMessage.textContent = starQuality === 3
    ? 'Amazing! You are a number hero!' 
    : starQuality === 2
      ? 'Awesome! You are getting stronger.'
      : 'Good effort! Keep practicing and shine brighter!';
  if (starQuality >= 2) {
    popConfetti();
  }
}

function showHint() {
  const current = appState.questions[appState.questionIndex];
  if (!current) return;
  elements.hintPanel.classList.remove('hidden');
  elements.hintText.textContent = current.hint;
  appState.hintUsed = true;
}

function toggleSound() {
  appState.soundOn = !appState.soundOn;
  elements.soundToggle.textContent = appState.soundOn ? '🔊' : '🔇';
}

function playSound(type) {
  if (!appState.soundOn) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = 'triangle';
    oscillator.frequency.value = type === 'correct' ? 880 : 260;
    gain.gain.value = 0.12;
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.12);
    oscillator.onended = () => ctx.close();
  } catch (error) {
    // sound may be blocked on some browsers
  }
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('visible'), 20);
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, 1200);
}

function popConfetti() {
  const count = 24;
  const layer = elements.confettiLayer;
  layer.innerHTML = '';
  for (let i = 0; i < count; i += 1) {
    const div = document.createElement('div');
    div.className = 'confetti-piece';
    div.style.color = ['#ffb545', '#6c63ff', '#ff63a5', '#3fd3d2'][i % 4];
    div.style.left = `${randomBetween(10, 90)}%`;
    div.style.top = `${randomBetween(0, 20)}%`;
    div.style.opacity = '0';
    layer.appendChild(div);
    const delay = Math.random() * 300;
    setTimeout(() => {
      div.style.transition = 'transform 1.4s ease-out, opacity 1.4s ease-out';
      div.style.opacity = '1';
      div.style.transform = `translate(${randomBetween(-40, 40)}px, ${randomBetween(120, 260)}px) rotate(${randomBetween(90, 360)}deg)`;
    }, delay);
  }
  setTimeout(() => { layer.innerHTML = ''; }, 1800);
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(array) {
  const mix = [...array];
  for (let i = mix.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [mix[i], mix[j]] = [mix[j], mix[i]];
  }
  return mix;
}

window.addEventListener('DOMContentLoaded', init);
