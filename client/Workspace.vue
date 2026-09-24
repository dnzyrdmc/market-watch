<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { api, act } from "./api";
const market = ref({ symbols: [], prices: [], watch: [], alerts: [] }),
  symbol = ref("BTC-DEMO"),
  threshold = ref(61000),
  history = ref([]),
  connected = ref(false);
let events;
async function load() {
  market.value = await api("/market");
  history.value = await api("/prices/" + symbol.value);
}
const points = computed(() => {
  const a = history.value;
  if (!a.length) return "";
  const lo = Math.min(...a.map((t) => t.price)),
    hi = Math.max(...a.map((t) => t.price));
  return a
    .map(
      (t, i) =>
        `${(i * 600) / Math.max(1, a.length - 1)},${140 - ((t.price - lo) / Math.max(0.01, hi - lo)) * 120}`,
    )
    .join(" ");
});
onMounted(async () => {
  await act(load, "");
  events = new EventSource("/api/events");
  events.onopen = () => (connected.value = true);
  events.onerror = () => (connected.value = false);
  events.addEventListener("price", (e) => {
    const p = JSON.parse(e.data);
    const i = market.value.prices.findIndex((x) => x.symbol === p.symbol);
    if (i >= 0 && p.seq > market.value.prices[i].seq)
      market.value.prices[i] = p;
    if (
      p.symbol === symbol.value &&
      (!history.value.length || p.seq > history.value.at(-1).seq)
    ) {
      history.value.push(p);
      history.value = history.value.slice(-100);
    }
  });
  events.addEventListener("alert", () => act(load, "Eşik alarmı tetiklendi"));
});
onUnmounted(() => events?.close());
</script>
<template>
  <div class="toolbar">
    <span class="badge">{{
      connected ? "Canlı simülatör bağlı" : "Bağlantı bekleniyor"
    }}</span
    ><button class="ghost" @click="act(load, 'Yenilendi')">
      Snapshot yenile
    </button>
  </div>
  <div class="grid three">
    <div v-for="p in market.prices" :key="p.symbol" class="panel">
      <h2>{{ p.symbol }}</h2>
      <div class="stat">{{ p.price.toFixed(2) }}</div>
      <small>Sıra {{ p.seq }} · {{ new Date(p.at).toLocaleTimeString() }}</small
      ><button
        class="ghost"
        @click="
          act(async () => {
            await api('/watch/' + p.symbol, 'PUT', {});
            await load();
          })
        "
      >
        Favoriye ekle
      </button>
    </div>
  </div>
  <div class="grid">
    <section class="panel">
      <h2>Son 100 fiyat noktası</h2>
      <label
        >Varlık<select v-model="symbol" @change="act(load, '')">
          <option v-for="s in market.symbols">{{ s }}</option>
        </select></label
      ><svg viewBox="0 0 600 160" role="img" aria-label="Simüle fiyat çizgisi">
        <polyline
          :points="points"
          fill="none"
          stroke="#167d88"
          stroke-width="3"
        />
      </svg>
      <p class="muted">
        Gerçek piyasa verisi değildir. Grafik fiyat değişimini gösterir.
      </p>
    </section>
    <form
      class="panel"
      @submit.prevent="
        act(async () => {
          await api('/alerts', 'POST', { symbol, threshold });
          await load();
        })
      "
    >
      <h2>Üst eşik alarmı</h2>
      <label
        >Eşik<input
          v-model="threshold"
          type="number"
          min="0.01"
          step="0.01" /></label
      ><button>Alarm kur</button>
      <div v-for="a in market.alerts" class="card">
        {{ a.symbol }} &gt; {{ a.threshold }} ·
        {{ a.armed ? "Kurulu" : "Tetiklendi" }}
        <button
          class="ghost small"
          @click.prevent="
            act(async () => {
              await api('/alerts/' + a.id, 'DELETE');
              await load();
            })
          "
        >
          Sil
        </button>
      </div>
    </form>
  </div>
  <section class="panel">
    <h2>Favoriler</h2>
    <div class="toolbar">
      <button
        v-for="w in market.watch"
        class="ghost"
        @click="
          act(async () => {
            await api('/watch/' + w.symbol, 'DELETE');
            await load();
          })
        "
      >
        {{ w.symbol }} ×
      </button>
    </div>
  </section>
</template>
