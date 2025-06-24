// game.js

const cardDatabase = {
    // The Cogwork Order
    "COG001": { name: "Clockwork Scout", type: "Unit", faction: "The Cogwork Order", cost: 1, atk: 1, hp: 2, ability: null, lore: "Ever watchful, ever ticking." },
    "COG002": { name: "Automated Sentry", type: "Unit", faction: "The Cogwork Order", cost: 3, atk: 2, hp: 4, ability: "Guard", lore: "It does not sleep, it only waits." },
    "COG003": { name: "Gearsmith", type: "Unit", faction: "The Cogwork Order", cost: 2, atk: 2, hp: 2, ability: null, lore: "Precision is key." },
    "COG004": { name: "Overcharge", type: "Spell", faction: "The Cogwork Order", cost: 2, effect: "deal_damage", value: 3, target: "any", lore: "A controlled burst of pure energy." },

    // The Verdant Wardens
    "VRD001": { name: "Grove Tender", type: "Unit", faction: "The Verdant Wardens", cost: 2, atk: 2, hp: 3, ability: null, lore: "Life finds a way." },
    "VRD002": { name: "Wildwood Beast", type: "Unit", faction: "The Verdant Wardens", cost: 4, atk: 5, hp: 4, ability: "Overwhelm", lore: "The forest's fury unleashed." },
    "VRD003": { name: "Ancient Guardian", type: "Unit", faction: "The Verdant Wardens", cost: 5, atk: 4, hp: 6, ability: "Guard", lore: "As old as the mountains themselves." },
    "VRD004": { name: "Nature's Grasp", type: "Spell", faction: "The Verdant Wardens", cost: 3, effect: "destroy_unit", target: "enemy_unit", lore: "The earth reclaims its own." }
};

// game.js (lanjutan)

// game.js (di atas gameState)
let selectedHandCard = null;
let selectedAttacker = null;

let gameState = {
    currentPlayer: 1,
    players: {
        1: {
            hp: 30,
            essence: 1,
            maxEssence: 1,
            deck: [],
            hand: [],
            lanes: [null, null, null], // null means empty lane
            void: []
        },
        2: {
            hp: 30,
            essence: 1,
            maxEssence: 1,
            deck: [],
            hand: [],
            lanes: [null, null, null],
            void: []
        }
    },
    turn: 1
};

// game.js (lanjutan)

function renderCard(cardData) {
    // Hanya render kartu jika datanya ada
    if (!cardData) return '';

    let abilityText = cardData.ability ? `<div class="card-ability">${cardData.ability}</div>` : '';
    let stats = cardData.type === 'Unit' ? `
        <div class="card-stats">
            <span class="card-atk">${cardData.atk}</span>
            <span class="card-hp">${cardData.hp}</span>
        </div>` : '';
    return `
        <div class="card" data-card-id="${cardData.id}" data-card-type="${cardData.type}">
            <div class="card-header">
                <span class="card-name">${cardData.name}</span>
                <span class="card-cost">${cardData.cost}</span>
            </div>
            <div class="card-art"></div>
            ${abilityText}
            ${stats}
        </div>
    `;
}

function renderGame() {
    // Render Player 1 Info & Hand
    document.getElementById('p1-hp').innerText = gameState.players[1].hp;
    document.getElementById('p1-essence').innerText = `<span class="math-inline">\{gameState\.players\[1\]\.essence\}/</span>{gameState.players[1].maxEssence}`;
    document.getElementById('p1-deck-count').innerText = gameState.players[1].deck.length;

    const p1Hand = document.getElementById('p1-hand');
    p1Hand.innerHTML = '';
    gameState.players[1].hand.forEach(card => {
        p1Hand.innerHTML += renderCard(card);
    });

    // Render Player 2 Info & Hand (kartu tertutup untuk prototipe)
    document.getElementById('p2-hp').innerText = gameState.players[2].hp;
    document.getElementById('p2-essence').innerText = `<span class="math-inline">\{gameState\.players\[2\]\.essence\}/</span>{gameState.players[2].maxEssence}`;
    const p2Hand = document.getElementById('p2-hand');
    p2Hand.innerHTML = ''; // Sembunyikan kartu lawan
    gameState.players[2].hand.forEach(() => {
        p2Hand.innerHTML += '<div class="card-back"></div>'; // Gunakan CSS untuk .card-back
    });


    // Render Lanes
    for (let i = 1; i <= 3; i++) {
        document.getElementById(`p1-lane-${i}`).innerHTML = renderCard(gameState.players[1].lanes[i-1]);
        document.getElementById(`p2-lane-${i}`).innerHTML = renderCard(gameState.players[2].lanes[i-1]);
    }

    // Add event listeners to newly rendered cards
    addCardEventListeners();
}

// game.js (lanjutan)

function addCardEventListeners() {
    // Event listener untuk kartu di tangan
    document.querySelectorAll('#p1-hand .card').forEach(cardEl => {
        cardEl.addEventListener('click', () => {
            const cardId = cardEl.dataset.cardId;
            const card = gameState.players[1].hand.find(c => c.id === cardId);

            // Cek jika bisa memainkan kartu
            if (card.cost <= gameState.players[1].essence) {
                console.log(`Selected card from hand: ${card.name}`);
                selectedHandCard = card;
                // Tambahkan highlight visual untuk kartu yang dipilih (opsional)
            } else {
                console.log("Not enough essence!");
            }
        });
    });

    // Event listener untuk lane kosong (memainkan unit)
    document.querySelectorAll('#p1-lanes .lane').forEach((laneEl, index) => {
        laneEl.addEventListener('click', () => {
            if (selectedHandCard && selectedHandCard.type === 'Unit' && !gameState.players[1].lanes[index]) {
                playUnit(selectedHandCard, 1, index);
                selectedHandCard = null;
            }
        });
    });

    // Event listener untuk unit di lane (memilih penyerang)
document.querySelectorAll('#p1-lanes .card').forEach((cardEl, index) => {
    cardEl.addEventListener('click', () => {
        const card = gameState.players[1].lanes[index];
        if(card) {
            console.log(`Selected attacker: ${card.name}`);
            selectedAttacker = { card, laneIndex: index, player: 1 };
        }
    });
});

// Event listener untuk lane lawan (memilih target)
document.querySelectorAll('#p2-lanes .lane').forEach((laneEl, index) => {
    laneEl.addEventListener('click', () => {
        if (selectedAttacker && selectedAttacker.laneIndex === index) { // GDD: Hanya bisa serang lajur di depan
            const targetCard = gameState.players[2].lanes[index];
            if(targetCard) {
                // Unit vs Unit combat
                unitCombat(selectedAttacker, { card: targetCard, laneIndex: index, player: 2 });
            } else {
                // Serang Architect lawan
                attackArchitect(selectedAttacker);
            }
            selectedAttacker = null;
        }
    });
});
}

function playUnit(card, player, laneIndex) {
    const playerState = gameState.players[player];

    // Bayar cost
    playerState.essence -= card.cost;

    // Pindahkan kartu dari tangan ke lane
    playerState.lanes[laneIndex] = card;
    playerState.hand = playerState.hand.filter(c => c.id !== card.id);

    console.log(`${card.name} played in lane ${laneIndex + 1}`);
    renderGame();
}

// game.js (lanjutan)

document.getElementById('end-turn-button').addEventListener('click', endTurn);

function endTurn() {
    // Reset state pemilihan
    selectedHandCard = null;
    selectedAttacker = null;

    // Pindah ke pemain berikutnya
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    gameState.turn++;

    const nextPlayer = gameState.players[gameState.currentPlayer];

    // GDD: Increase Max Essence each turn, up to 10
    if (nextPlayer.maxEssence < 10) {
        nextPlayer.maxEssence++;
    }

    // GDD: Refill Essence
    nextPlayer.essence = nextPlayer.maxEssence;

    // GDD: Draw one card
    drawCard(gameState.currentPlayer);

    console.log(`Turn ${gameState.turn}, Player ${gameState.currentPlayer}'s turn.`);

    // Untuk prototipe hot-seat, kita hanya render ulang.
    // Dalam game nyata, kita perlu membalik papan atau mengubah perspektif.
    alert(`Player ${gameState.currentPlayer}'s Turn!`); // Notifikasi sederhana
    renderGame();
}

// game.js (lanjutan)

function unitCombat(attackerInfo, defenderInfo) {
    const attackerCard = attackerInfo.card;
    const defenderCard = defenderInfo.card;

    console.log(`${attackerCard.name} attacks ${defenderCard.name}!`);

    // GDD: Unit deal damage
    defenderCard.hp -= attackerCard.atk;
    attackerCard.hp -= defenderCard.atk;

    // Cek jika ada unit yang hancur
    if (defenderCard.hp <= 0) {
        gameState.players[defenderInfo.player].lanes[defenderInfo.laneIndex] = null;
        // Pindahkan ke Void (discard pile)
        gameState.players[defenderInfo.player].void.push(defenderCard);
    }
    if (attackerCard.hp <= 0) {
        gameState.players[attackerInfo.player].lanes[attackerInfo.laneIndex] = null;
        gameState.players[attackerInfo.player].void.push(attackerCard);
    }

    renderGame();
    checkWinCondition();
}

function attackArchitect(attackerInfo) {
    const opponent = attackerInfo.player === 1 ? 2 : 1;
    console.log(`${attackerInfo.card.name} attacks the enemy Architect!`);

    gameState.players[opponent].hp -= attackerInfo.card.atk;

    renderGame();
    checkWinCondition();
}

function checkWinCondition() {
    if (gameState.players[1].hp <= 0) {
        alert("Player 2 Wins!");
    } else if (gameState.players[2].hp <= 0) {
        alert("Player 1 Wins!");
    }
}

function drawCard(player) {
    const playerState = gameState.players[player];
    if (playerState.deck.length > 0) {
        const card = playerState.deck.shift();
        playerState.hand.push(card);
    } else {
        console.log(`Player ${player} deck is empty!`);
    }
}

function initializeGame() {
    // Siapkan deck untuk kedua pemain (gunakan semua kartu di cardDatabase, duplikat seperlunya)
    function createDeck() {
        // Contoh: 2 kopi tiap kartu unit, 1 kopi tiap spell
        let deck = [];
        Object.entries(cardDatabase).forEach(([id, card]) => {
            let count = card.type === 'Unit' ? 2 : 1;
            for (let i = 0; i < count; i++) {
                // Set id unik untuk tiap kartu di deck
                deck.push({ ...card, id: id + '-' + i });
            }
        });
        // Kocok deck
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }
    gameState.players[1].deck = createDeck();
    gameState.players[2].deck = createDeck();
    // Kosongkan hand, lanes, void
    [1,2].forEach(p => {
        gameState.players[p].hand = [];
        gameState.players[p].lanes = [null, null, null];
        gameState.players[p].void = [];
        gameState.players[p].hp = 30;
        gameState.players[p].essence = 1;
        gameState.players[p].maxEssence = 1;
    });
    gameState.currentPlayer = 1;
    gameState.turn = 1;
    // Draw 3 kartu awal untuk tiap pemain
    for (let i = 0; i < 3; i++) {
        drawCard(1);
        drawCard(2);
    }
    renderGame();
}

// game.js (di paling bawah)
initializeGame();