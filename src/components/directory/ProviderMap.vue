<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/* E.2. leaflet over openstreetmap tiles rather than mapbox or google.

   nothing here needs geocoding: every provider already carries lat and lng in
   the seed, and suburb search is a text match against our own data. so there is
   no api key, no account and no billing to go wrong, and the map still shows
   real locations.

   the markers follow the filters. toggling Rainbow Tick thins the map, which is
   the point of having it beside the list rather than instead of it. */

const props = defineProps({
  providers: { type: Array, required: true },
  origin: { type: Object, required: true },
  originLabel: { type: String, default: '' },
  radiusKm: { type: Number, default: 0 },
  height: { type: String, default: '520px' },
})

const emit = defineEmits(['select'])

const el = ref(null)
let map = null
let markerLayer = null
let originMarker = null
let radiusRing = null

// scroll wheel zoom starts off and turns on once the map is clicked. a map that
// swallows the page scroll the moment your cursor passes over it is worse than
// one that needs a click first. pinch on a phone works either way, leaflet
// handles that itself
const zoomArmed = ref(false)

// leaflet's default icon urls break under a bundler, so the pin is drawn with
// a div and css instead of shipping three images
const pinIcon = L.divIcon({
  className: 'map-pin',
  html: '<span class="map-pin__dot"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

const youIcon = L.divIcon({
  className: 'map-you',
  html: '<span class="map-you__dot"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const escapeHtml = (value) =>
  String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function draw() {
  if (!map) return

  markerLayer.clearLayers()

  const points = []
  for (const provider of props.providers) {
    if (typeof provider.lat !== 'number' || typeof provider.lng !== 'number') continue

    const marker = L.marker([provider.lat, provider.lng], {
      icon: pinIcon,
      // the accessible name a screen reader reads off the marker
      alt: `${provider.name}, ${provider.practiceName}`,
      keyboard: true,
    })

    marker.bindPopup(
      `<strong>${escapeHtml(provider.name)}</strong><br>` +
        `${escapeHtml(provider.practiceName)}, ${escapeHtml(provider.suburb)}<br>` +
        `<button type="button" class="map-popup__link" data-slug="${escapeHtml(provider.slug)}">View profile</button>`,
    )

    markerLayer.addLayer(marker)
    points.push([provider.lat, provider.lng])
  }

  if (radiusRing) radiusRing.remove()
  if (props.radiusKm) {
    radiusRing = L.circle([props.origin.lat, props.origin.lng], {
      radius: props.radiusKm * 1000,
      color: '#522e63',
      weight: 2,
      fillColor: '#522e63',
      fillOpacity: 0.06,
    }).addTo(map)
  } else {
    radiusRing = null
  }

  if (originMarker) originMarker.remove()
  originMarker = L.marker([props.origin.lat, props.origin.lng], {
    icon: youIcon,
    alt: props.originLabel || 'Your search location',
    interactive: false,
  }).addTo(map)

  /* with a radius set, frame the circle rather than the pins, so the view stays
     put as filters come and go. without one, fit whatever is on screen */
  if (radiusRing) {
    map.fitBounds(radiusRing.getBounds(), { padding: [24, 24] })
    return
  }

  points.push([props.origin.lat, props.origin.lng])
  if (points.length > 1) map.fitBounds(points, { padding: [40, 40], maxZoom: 14 })
}

// the popup button is plain html inside leaflet, so the click is caught on the
// container rather than bound per marker
function onPopupClick(event) {
  const slug = event.target?.dataset?.slug
  if (slug) emit('select', slug)
}

onMounted(() => {
  map = L.map(el.value, { scrollWheelZoom: false }).setView(
    [props.origin.lat, props.origin.lng],
    12,
  )

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map)

  markerLayer = L.layerGroup().addTo(map)
  el.value.addEventListener('click', onPopupClick)

  map.on('click', armZoom)
  map.on('focus', armZoom)
  map.on('mouseout', disarmZoom)
  map.on('blur', disarmZoom)

  draw()
})

function armZoom() {
  map?.scrollWheelZoom.enable()
  zoomArmed.value = true
}

function disarmZoom() {
  map?.scrollWheelZoom.disable()
  zoomArmed.value = false
}

watch(() => [props.providers, props.origin, props.radiusKm], draw, { deep: true })

onBeforeUnmount(() => {
  el.value?.removeEventListener('click', onPopupClick)
  map?.remove()
  map = null
})
</script>

<template>
  <div>
    <div class="map-wrap">
      <div
        ref="el"
        class="map"
        :style="{ height }"
        role="application"
        aria-label="Map of matching providers"
      ></div>

      <p v-if="!zoomArmed" class="map-hint" aria-hidden="true">
        Click the map to zoom with the scroll wheel
      </p>
    </div>
    <p class="text-muted small mt-2 mb-0">
      {{ providers.length }} {{ providers.length === 1 ? 'provider' : 'providers' }} shown.
      The list below the map carries the same results in text.
    </p>
  </div>
</template>

<style>
/* not scoped: leaflet injects its own markup and popups outside this component */
.map-wrap {
  position: relative;
}

/* aria-hidden because it is a mouse instruction. a keyboard user gets +/- and
   a touch user pinches, neither of which needs telling */
.map-hint {
  position: absolute;
  left: 50%;
  bottom: 0.75rem;
  transform: translateX(-50%);
  z-index: 400;
  margin: 0;
  padding: 0.4rem 0.9rem;
  border-radius: var(--iris-radius-pill);
  background: rgba(36, 59, 71, 0.85);
  color: #fff;
  font-size: 0.82rem;
  pointer-events: none;
}

.map {
  width: 100%;
  border-radius: var(--iris-radius-md);
  border: 1px solid var(--iris-border);
  z-index: 0;
}

.map-pin__dot,
.map-you__dot {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}

.map-pin__dot {
  background: var(--iris-purple-900);
  border: 3px solid #fff;
}

.map-you__dot {
  background: var(--iris-pink, #d94f7d);
  border: 3px solid #fff;
}

.leaflet-marker-icon:focus-visible {
  outline: 3px solid var(--iris-purple-500);
  outline-offset: 3px;
}

.map-popup__link {
  border: 0;
  background: none;
  padding: 0.35rem 0;
  color: var(--iris-purple-900);
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}
</style>
