"use strict";

const LOGGING = false;
const MAX_ATTEMPTS = 99;

let h = 0;
let s = 0;
let l = 0;
let hInput, sInput, lInput;
let hh, ss, ll;
let info, submit, restart, result, status, mode;
let attempts = 0;
let statusTimer = null;
let slidersFrozen = false;

function init() {
  hInput = document.getElementById("hin");
  sInput = document.getElementById("sin");
  lInput = document.getElementById("lin");
  info = document.getElementById("info");
  submit = document.getElementById("submit");
  restart = document.getElementById("restart");
  result = document.getElementById("result");
  status = document.getElementById("status");
  mode = document.getElementById("mode");

  hInput.addEventListener("change", readInput);
  sInput.addEventListener("change", readInput);
  lInput.addEventListener("change", readInput);

  hInput.addEventListener("input", readInput);
  sInput.addEventListener("input", readInput);
  lInput.addEventListener("input", readInput);

  submit.addEventListener("click", submitInput);
  restart.addEventListener("click", newGame);
  mode.addEventListener("click", changeMode);
  newGame();
}

function newGame() {
  pickHSL();
  setupGame(h, s, l);
}

function setGame(hh, ss, ll) {
  // eslint-disable-line no-unused-vars
  // Useful to set arbitrary colors for local testing.
  h = hh;
  s = ss;
  l = ll;
  setupGame(h, s, l);
}

function pickHSL() {
  h = Math.floor(Math.random() * 360);
  s = Math.floor(Math.random() * 100);
  l = Math.floor(Math.random() * 100);
}

function setupGame(h, s, l) {
  log("setting up new game");
  info.style.display = "inline-block";
  submit.style.display = "none";
  restart.style.display = "none";
  status.style.display = "none";
  result.innerHTML = "";
  attempts = 0;
  hInput.disabled = sInput.disabled = lInput.disabled = false;
  slidersFrozen = false;
  hInput.value = lInput.value = sInput.value = 7;
  paintGame(h, s, l);
  mode.href = window.location.hash === "#x" ? "#" : "#x";
  log("new game is ready");
}

function paintGame(h, s, l) {
  const dark = luminance(h, s, l) < luminance(0, 0, 34.5);
  document.body.style.background = toCssHsl(h, s, l);
  document.body.style.color = dark ? "#fff" : "#000";
  const anchors = document.getElementsByTagName("a");
  for (let i = 0; i < anchors.length; ++i) {
    const a = anchors[i];
    a.style.color = dark ? "#eef" : "#006";
  }
}

function readInput(e) {
  if (slidersFrozen) {
    hInput.valueAsNumber = hh;
    sInput.valueAsNumber = ss;
    lInput.valueAsNumber = ll;
  } else {
    hh = hInput.valueAsNumber;
    ss = sInput.valueAsNumber;
    ll = lInput.valueAsNumber;
    submit.innerHTML = "Submit " + toCssHsl(hh, ss, ll);
    submit.style.display = "inline-block";
    info.style.display = "none";
  }
}

function submitInput() {
  addMove(h, s, l, hh, ss, ll, ++attempts);
}

function addMove(h, s, l, hh, ss, ll, attempts) {
  const dark = luminance(hh, ss, ll) < luminance(8, 8, 8);
  const hslValue = toCssHsl(hh, ss, ll);
  const won = hh === h && ss === s && ll === l;
  const lPad = attempts < 10 ? "&nbsp;" : "";
  const rPad = "&nbsp;";
  let scored = score(h, s, l, hh, ss, ll);
  const div = document.createElement("div");
  scored = (scored < 10 ? "0" : "") + scored;
  div.style.background = hslValue;
  div.style.color = dark ? "#fff" : "#000";
  div.innerHTML = lPad + attempts + ") " + hslValue;
  log(
    "input=" +
      hh +
      "," +
      ss +
      "," +
      ll +
      " hex=" +
      hslValue +
      " scored=" +
      scored +
      " won=" +
      won
  );
  if (won) {
    div.innerHTML += " (Splendid!)" + rPad;
    div.style.border = "thin solid #" + (dark ? "ccc" : "333");
    win();
  } else if (window.location.hash === "#x") {
    div.innerHTML += " (Try again)" + rPad;
  } else {
    div.innerHTML += " (" + scored + "% match)" + rPad;
  }
  document.getElementById("result").prepend(div);
  if (attempts === MAX_ATTEMPTS) {
    halt();
  }
}

function halt() {
  hInput.disabled = sInput.disabled = lInput.disabled = true;
  submit.style.display = "none";
  restart.style.display = "inline-block";
  log("halt complete");
}

function win() {
  slidersFrozen = true;
  submit.style.display = "none";
  restart.style.display = "inline-block";
  log("win complete");
}

function score(h, s, l, hh, ss, ll) {
  const maxHErr = Math.max(h, 360 - h);
  const maxSErr = Math.max(s, 100 - s);
  const maxLErr = Math.max(l, 100 - l);
  const maxDist = Math.sqrt(
    maxHErr * maxHErr + maxSErr * maxSErr + maxLErr * maxLErr
  );
  const hErr = Math.abs(hh - h);
  const sErr = Math.abs(ss - s);
  const lErr = Math.abs(ll - l);
  const dist = Math.sqrt(hErr * hErr + sErr * sErr + lErr * lErr);
  return Math.floor(100 * (1 - dist / maxDist));
}

function toCssHsl(h, s, l) {
  return `hsl(${h} ${s}% ${l}%)`.toUpperCase();
}

function luminance(h, s, l) {
  return l; // not technically correct but should be good enough to determine with text color to use
}

function changeMode(e) {
  e.preventDefault();
  if (window.location.hash === "#x") {
    window.history.replaceState(null, "", "#");
    mode.href = "#x";
    showStatus("Switched to normal mode!");
  } else {
    window.history.replaceState(null, "", "#x");
    mode.href = "#";
    showStatus("Switched to expert mode!");
  }
}

function showStatus(msg) {
  let opacity = 100;
  let subtract = 0.01;

  status.style.display = "inline-block";
  status.style.opacity = opacity + "%";
  status.innerHTML = msg;

  if (statusTimer != null) {
    clearTimeout(statusTimer);
  }

  statusTimer = setInterval(function () {
    opacity -= subtract;
    subtract *= 1.2;
    if (statusTimer != null && opacity <= 0) {
      clearTimeout(statusTimer);
      statusTimer = null;
      status.style.display = "none";
    }
    status.style.opacity = opacity + "%";
  }, 50);
}

function log() {
  const args = Array.prototype.slice.call(arguments);
  if (LOGGING) {
    console.log(
      "attempts=" +
        attempts +
        " color=" +
        h +
        "," +
        s +
        "," +
        l +
        " cssValue=" +
        toCssHsl(h, s, l) +
        " " +
        args.join(" ")
    );
  }
}

window.addEventListener("load", init);
