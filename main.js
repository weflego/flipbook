// References to DOM elements
const prevBtn = document.querySelector('#prev-btn');
const nextBtn = document.querySelector('#next-btn');
const book    = document.querySelector('#book');

const papers = [
    document.querySelector('#p1'),
    document.querySelector('#p2'),
    document.querySelector('#p3')
];

// Event listeners
prevBtn.addEventListener("click", goPrevious);
nextBtn.addEventListener("click", goNext);

let currentState = 1;
const maxState   = papers.length + 1;
let   animating  = false;

// ─── Book positioning ────────────────────────────────────────────────────────

function openBook() {
    book.style.transform        = "translateX(50%)";
    prevBtn.style.transform     = "translateX(-180px)";
    nextBtn.style.transform     = "translateX(180px)";

    const bgAudio = document.getElementById('bg-audio');
    if (bgAudio && bgAudio.paused) bgAudio.play();
}

function closeBook(isFirstPage) {
    book.style.transform    = isFirstPage ? "translateX(0%)" : "translateX(100%)";
    prevBtn.style.transform = "translateX(0px)";
    nextBtn.style.transform = "translateX(0px)";
}

// ─── Safari-safe flip ────────────────────────────────────────────────────────
//
// CSS backface-visibility is broken on iOS Safari when elements are nested.
// Instead we do a 2-phase scaleX animation entirely in JS:
//   Phase 1 (fold):   scaleX 1 → 0  (duration ms), showing the visible face
//   Swap:             hide old face, show new face (instant, at scaleX = 0)
//   Phase 2 (unfold): scaleX 0 → 1  (duration ms), revealing the new face
//
// This works on every browser with zero CSS 3D quirks.

const HALF = 250; // ms per half

function flipForward(paper, onDone) {
    const front = paper.querySelector('.front');
    const back  = paper.querySelector('.back');

    // Phase 1: fold (scaleX 1 → 0), pivot on left edge
    front.style.transition      = `transform ${HALF}ms ease-in`;
    front.style.transformOrigin = 'left center';
    front.style.transform       = 'scaleX(0)';

    setTimeout(() => {
        // Swap: hide front, show back already at scaleX 0
        front.style.display      = 'none';
        front.style.transition   = '';
        front.style.transform    = '';

        back.style.display          = 'flex';
        back.style.transformOrigin  = 'left center';
        back.style.transform        = 'scaleX(0)';

        // Force reflow so the browser registers scaleX(0) before we transition
        back.getBoundingClientRect();

        // Phase 2: unfold (scaleX 0 → 1)
        back.style.transition = `transform ${HALF}ms ease-out`;
        back.style.transform  = 'scaleX(1)';

        setTimeout(() => {
            back.style.transition = '';
            if (onDone) onDone();
        }, HALF);

    }, HALF);
}

function flipBackward(paper, onDone) {
    const front = paper.querySelector('.front');
    const back  = paper.querySelector('.back');

    // Phase 1: fold the back face (scaleX 1 → 0)
    back.style.transition      = `transform ${HALF}ms ease-in`;
    back.style.transformOrigin = 'left center';
    back.style.transform       = 'scaleX(0)';

    setTimeout(() => {
        // Swap: hide back, show front at scaleX 0
        back.style.display    = 'none';
        back.style.transition = '';
        back.style.transform  = '';

        front.style.display         = 'flex';
        front.style.transformOrigin = 'left center';
        front.style.transform       = 'scaleX(0)';

        front.getBoundingClientRect();

        // Phase 2: unfold front
        front.style.transition = `transform ${HALF}ms ease-out`;
        front.style.transform  = 'scaleX(1)';

        setTimeout(() => {
            front.style.transition = '';
            if (onDone) onDone();
        }, HALF);

    }, HALF);
}

// ─── Navigation ──────────────────────────────────────────────────────────────

function goNext() {
    if (animating || currentState >= maxState) return;
    animating = true;

    const idx   = currentState - 1;   // 0-based paper index
    const paper = papers[idx];

    if (currentState === 1)               openBook();
    if (currentState === papers.length)   closeBook(false);

    // Bring this paper to the front while it animates
    paper.style.zIndex = 10;

    flipForward(paper, () => {
        // Settle z-index: flipped papers sit below unflipped ones
        paper.style.zIndex = idx + 1;
        animating = false;
    });

    currentState++;
}

function goPrevious() {
    if (animating || currentState <= 1) return;
    animating = true;

    currentState--;
    const idx   = currentState - 1;
    const paper = papers[idx];

    if (currentState === 1)             closeBook(true);
    if (currentState === papers.length) openBook();

    paper.style.zIndex = 10;

    flipBackward(paper, () => {
        // Restore original stacking (p1=3, p2=2, p3=1)
        paper.style.zIndex = papers.length - idx;
        animating = false;
    });
}
