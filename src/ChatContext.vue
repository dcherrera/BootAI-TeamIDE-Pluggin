<template>
  <div class="chat-context">
    <template v-if="!showAddForm">
      <div class="section-header">Current Endpoint</div>

      <q-input
        v-model="editName"
        label="Name"
        dense
        outlined
        class="q-mb-xs"
        @update:model-value="saveEndpoint"
      />
      <q-input
        v-model="editUrl"
        label="URL"
        dense
        outlined
        class="q-mb-xs"
        @update:model-value="saveEndpoint"
      />
      <q-input
        v-model="editModel"
        label="Model"
        dense
        outlined
        class="q-mb-xs"
        @update:model-value="saveEndpoint"
      />
      <q-input
        v-model="editApiKey"
        label="API Key (optional)"
        dense
        outlined
        type="password"
        class="q-mb-xs"
        @update:model-value="saveEndpoint"
      />

      <q-separator class="q-my-sm" />

      <q-input
        v-model.number="editTemp"
        label="Temperature"
        dense
        outlined
        type="number"
        step="0.1"
        min="0"
        max="2"
        class="q-mb-xs"
        @update:model-value="saveEndpoint"
      />
      <q-input
        v-model.number="editMaxTokens"
        label="Max Tokens"
        dense
        outlined
        type="number"
        step="32"
        min="1"
        max="8192"
        class="q-mb-xs"
        @update:model-value="saveEndpoint"
      />

      <q-separator class="q-my-sm" />

      <div class="row q-gutter-xs q-mb-sm">
        <q-btn
          label="Test"
          icon="wifi"
          dense
          flat
          :color="statusColor"
          :loading="isTesting"
          @click="testConn"
          class="col"
        />
        <q-icon
          v-if="connStatus !== 'idle'"
          :name="connStatus === 'ok' ? 'check_circle' : 'error'"
          :color="connStatus === 'ok' ? 'positive' : 'negative'"
          size="20px"
          class="q-ml-xs self-center"
        />
      </div>

      <q-btn
        label="Add Endpoint"
        icon="add"
        dense
        flat
        color="primary"
        class="full-width q-mb-xs"
        @click="showAddForm = true"
      />

      <q-btn
        v-if="store.endpoints.length > 1"
        label="Delete Endpoint"
        icon="delete"
        dense
        flat
        color="negative"
        class="full-width"
        @click="store.removeEndpoint(store.activeEndpointId)"
      />
    </template>

    <template v-else>
      <div class="section-header">Add Endpoint</div>

      <q-input v-model="newName" label="Name" dense outlined class="q-mb-xs" />
      <q-input v-model="newUrl" label="URL" dense outlined placeholder="http://host:port/v1" class="q-mb-xs" />
      <q-input v-model="newModel" label="Model" dense outlined class="q-mb-xs" />
      <q-input v-model="newApiKey" label="API Key (optional)" dense outlined type="password" class="q-mb-xs" />

      <div class="row q-gutter-xs q-mt-sm">
        <q-btn label="Save" icon="save" dense color="primary" class="col" @click="addNewEndpoint" :disable="!newName || !newUrl" />
        <q-btn label="Cancel" dense flat class="col" @click="showAddForm = false" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useBootaiStore } from './store';

const store = useBootaiStore();

const editName = ref('');
const editUrl = ref('');
const editModel = ref('');
const editApiKey = ref('');
const editTemp = ref(0.7);
const editMaxTokens = ref(256);

const showAddForm = ref(false);
const newName = ref('');
const newUrl = ref('');
const newModel = ref('');
const newApiKey = ref('');
const isTesting = ref(false);

function loadFromEndpoint() {
  const ep = store.activeEndpoint;
  if (!ep) return;
  editName.value = ep.name;
  editUrl.value = ep.url;
  editModel.value = ep.model;
  editApiKey.value = ep.apiKey;
  editTemp.value = ep.temperature;
  editMaxTokens.value = ep.maxTokens;
}

watch(() => store.activeEndpointId, loadFromEndpoint, { immediate: true });

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function saveEndpoint() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    store.updateEndpoint(store.activeEndpointId, {
      name: editName.value,
      url: editUrl.value,
      model: editModel.value,
      apiKey: editApiKey.value,
      temperature: editTemp.value,
      maxTokens: editMaxTokens.value,
    });
  }, 300);
}

const connStatus = computed(() => store.connectionStatus[store.activeEndpointId] ?? 'idle');
const statusColor = computed(() => {
  if (connStatus.value === 'ok') return 'positive';
  if (connStatus.value === 'error') return 'negative';
  return 'primary';
});

async function testConn() {
  isTesting.value = true;
  await store.testConnection(store.activeEndpointId);
  isTesting.value = false;
}

function addNewEndpoint() {
  const ep = store.addEndpoint({
    name: newName.value,
    url: newUrl.value,
    model: newModel.value || 'default',
    apiKey: newApiKey.value,
    temperature: 0.7,
    maxTokens: 256,
  });
  store.switchEndpoint(ep.id);
  showAddForm.value = false;
  newName.value = '';
  newUrl.value = '';
  newModel.value = '';
  newApiKey.value = '';
}
</script>

<style scoped>
.chat-context {
  padding: 8px;
  height: 100%;
  overflow-y: auto;
}

.section-header {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #555;
}
</style>
