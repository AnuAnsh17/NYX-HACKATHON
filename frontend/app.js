const chainView = document.getElementById("chain-view");
const chainCountPill = document.getElementById("chain-count-pill");
const blockCountEl = document.getElementById("block-count");
const lastVerifiedEl = document.getElementById("last-verified");
const integrityBadge = document.getElementById("integrity-badge");
const appendBtn = document.getElementById("append-btn");
const appendStatus = document.getElementById("append-status");
const eventTypeEl = document.getElementById("event-type");
const customSuffixEl = document.getElementById("custom-suffix");
const verifyBtn = document.getElementById("verify-btn");
const tamperList = document.getElementById("tamper-list");

const cardFor = new Map();

function truncHash(h) {
    if (!h) return "";
    return h.length <= 14 ? h : h.slice(0, 8) + "…" + h.slice(-6);
}

function formatTime(ts) {
    if (!ts) return "";
    try {
        const d = new Date(ts);
        return d.toISOString().replace("T", " ").replace(/\.\d+Z$/, "Z");
    } catch (e) {
        return ts;
    }
}

function setAppendStatus(msg, kind) {
    appendStatus.textContent = msg || "";
    appendStatus.classList.remove("ok", "err");
    if (kind) appendStatus.classList.add(kind);
}

function updateCounts() {
    const n = cardFor.size;
    chainCountPill.textContent = n + (n === 1 ? " block" : " blocks");
    blockCountEl.textContent = String(n);
}

function appendCard(block) {
    if (cardFor.has(block.index)) return;
    const card = document.createElement("div");
    card.className = "block-card valid";
    card.innerHTML = `
        <div class="block-head">
            <span class="block-index">#${block.index}</span>
            <span class="block-status">VALID</span>
        </div>
        <div class="block-data"></div>
        <div class="block-meta">
            <div><span class="k">time </span><span class="v t-time"></span></div>
            <div><span class="k">prev </span><span class="v t-prev"></span></div>
            <div><span class="k">hash </span><span class="v t-hash"></span></div>
        </div>
    `;
    card.querySelector(".block-data").textContent = block.data;
    card.querySelector(".t-time").textContent = formatTime(block.timestamp);
    card.querySelector(".t-prev").textContent = truncHash(block.prev_hash);
    card.querySelector(".t-hash").textContent = truncHash(block.hash);
    chainView.appendChild(card);
    cardFor.set(block.index, { card, block });
    addTamperRow(block.index);
    updateCounts();
    chainView.scrollTop = chainView.scrollHeight;
}

function addTamperRow(index) {
    const row = document.createElement("div");
    row.className = "tamper-row";
    row.dataset.index = String(index);
    row.innerHTML = `<span class="t-index">Block #${index}</span>`;
    const btn = document.createElement("button");
    btn.className = "btn-tamper";
    btn.textContent = "Tamper";
    btn.addEventListener("click", () => tamperBlock(index));
    row.appendChild(btn);
    tamperList.appendChild(row);
}

function updateAllCardStatus(result) {
    for (const bs of result.blocks) {
        const entry = cardFor.get(bs.index);
        if (!entry) continue;
        const card = entry.card;
        card.classList.remove("valid", "broken");
        card.classList.add(bs.status === "VALID" ? "valid" : "broken");
        card.querySelector(".block-status").textContent = bs.status;
    }
}

function updateIntegrityBadge(valid) {
    integrityBadge.classList.remove("badge-valid", "badge-broken", "badge-unknown");
    if (valid === true) {
        integrityBadge.classList.add("badge-valid");
        integrityBadge.textContent = "VALID";
    } else if (valid === false) {
        integrityBadge.classList.add("badge-broken");
        integrityBadge.textContent = "CHAIN BROKEN";
    } else {
        integrityBadge.classList.add("badge-unknown");
        integrityBadge.textContent = "UNKNOWN";
    }
}

async function verify() {
    try {
        const res = await fetch("/verify");
        if (!res.ok) throw new Error("HTTP " + res.status);
        const result = await res.json();
        updateAllCardStatus(result);
        updateIntegrityBadge(result.valid);
        lastVerifiedEl.textContent = new Date().toLocaleTimeString();
    } catch (e) {
        setAppendStatus("verify failed: " + e.message, "err");
    }
}

async function tamperBlock(index) {
    try {
        const res = await fetch("/tamper", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ index })
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        await verify();
    } catch (e) {
        setAppendStatus("tamper failed: " + e.message, "err");
    }
}

async function appendEvent() {
    const type = eventTypeEl.value || "TXN";
    const suffix = (customSuffixEl.value || "").trim();
    const data = suffix ? `${type}:${suffix}` : `${type}:${randomTxnId()}`;
    appendBtn.disabled = true;
    setAppendStatus("appending…");
    try {
        const res = await fetch("/event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data })
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const block = await res.json();
        setAppendStatus(`appended #${block.index}`, "ok");
        customSuffixEl.value = "";
    } catch (e) {
        setAppendStatus("append failed: " + e.message, "err");
    } finally {
        appendBtn.disabled = false;
    }
}

function randomTxnId() {
    return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function startSSE() {
    const es = new EventSource("/events");
    es.onmessage = (ev) => {
        try {
            const block = JSON.parse(ev.data);
            appendCard(block);
        } catch (e) {
            // ignore malformed frames
        }
    };
    es.onerror = () => {
        // browser will auto-reconnect; no-op
    };
}

async function loadInitial() {
    try {
        const res = await fetch("/chain");
        if (!res.ok) throw new Error("HTTP " + res.status);
        const blocks = await res.json();
        for (const b of blocks) appendCard(b);
        updateIntegrityBadge(undefined);
    } catch (e) {
        setAppendStatus("load failed: " + e.message, "err");
    }
}

appendBtn.addEventListener("click", appendEvent);
verifyBtn.addEventListener("click", verify);

startSSE();
loadInitial();
