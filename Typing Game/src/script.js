const quotes = [
    'When you have eliminated the impossible, whatever remains, however improbable, must be the truth.',
    'There is nothing more deceptive than an obvious fact.',
    'I ought to know by this time that when a fact appears to be opposed to a long train of deductions it invariably proves to be capable of bearing some other interpretation.',
    'I never make exceptions. An exception disproves the rule.',
    'What one man can invent another can discover.',
    'Nothing clears up a case so much as stating it to another person.',
    'Education never ends, Watson. It is a series of lessons, with the greatest for the last.',
];

let words = [];
let wordIndex = 0;
let startTime = Date.now();
let bestScore = localStorage.getItem('bestScore') || null;

const quoteElement = document.getElementById('quote');
const messageElement = document.getElementById('message');
const typedValueElement = document.getElementById('typed-value');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modal-result');
const closeModal = document.getElementById('close-modal');
const bestScoreElement = document.getElementById('best-score');

// 최고 기록 표시
if (bestScore) {
    bestScoreElement.textContent = `Best Score: ${bestScore}s`;
}

document.getElementById('start').addEventListener('click', () => {
    const quoteIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[quoteIndex];
    words = quote.split(' ');
    wordIndex = 0;

    const spanWords = words.map(function(word) { return `<span>${word} </span>`});
    quoteElement.innerHTML = spanWords.join('');
    quoteElement.childNodes[0].className = 'highlight';
    messageElement.innerText = '';

    typedValueElement.value = '';
    typedValueElement.focus();
    typedValueElement.disabled = false;

    startTime = new Date().getTime();
});

typedValueElement.addEventListener('input', () => {
    const currentWord = words[wordIndex];
    const typedValue = typedValueElement.value;

    if (currentWord.startsWith(typedValue)) {
        typedValueElement.className = 'correct';
    } else {
        typedValueElement.className = 'error';
    }
});

typedValueElement.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const currentWord = words[wordIndex];
        const typedValue = typedValueElement.value;

        if (typedValue === currentWord && wordIndex === words.length - 1) {
            const elapsedTime = ((new Date().getTime() - startTime) / 1000).toFixed(2);
            
            // 최고 기록 확인 및 저장
            let isNewRecord = false;
            if (!bestScore || parseFloat(elapsedTime) < parseFloat(bestScore)) {
                bestScore = elapsedTime;
                localStorage.setItem('bestScore', bestScore);
                bestScoreElement.textContent = `Best Score: ${bestScore}s`;
                isNewRecord = true;
            }

            // 모달에 결과 표시
            showModal(elapsedTime, isNewRecord);
            
            typedValueElement.disabled = true;
            typedValueElement.className = '';
        } else if (typedValue === currentWord) {
            typedValueElement.value = '';
            typedValueElement.className = 'word-complete';
            
            // 단어 완성 애니메이션
            setTimeout(() => {
                typedValueElement.className = '';
            }, 300);
            
            wordIndex++;
            for (const wordElement of quoteElement.childNodes) {
                wordElement.className = '';
            }
            if (wordIndex < words.length) {
                quoteElement.childNodes[wordIndex].className = 'highlight';
            }
        }
    }
});

function showModal(time, isNewRecord) {
    modalContent.innerHTML = `
        ${isNewRecord ? '<div class="new-record">🎉 NEW RECORD!</div>' : '<div style="height: 20px;"></div>'}
        <div class="modal-time">${time}s</div>
        <div class="modal-message">CONGRATULATIONS!</div>
        ${bestScore ? `<div class="modal-best">Best Score: ${bestScore}s</div>` : '<div style="height: 20px;"></div>'}
    `;
    modal.style.display = 'flex';
}

closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});