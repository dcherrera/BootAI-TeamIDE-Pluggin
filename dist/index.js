(function() {
  "use strict";
  try {
    if (typeof document != "undefined") {
      var elementStyle = document.createElement("style");
      elementStyle.appendChild(document.createTextNode(".chat-nav[data-v-92c9d6d4] {\n  padding: 8px;\n  height: 100%;\n  overflow-y: auto;\n}\n\n.chat-main[data-v-e243a5fe] {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n}\n.message-list[data-v-e243a5fe] {\n  flex: 1;\n  overflow-y: auto;\n  padding: 12px;\n}\n.empty-state[data-v-e243a5fe] {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  height: 100%;\n  opacity: 0.7;\n}\n.message[data-v-e243a5fe] {\n  margin-bottom: 12px;\n  padding: 8px 12px;\n  border-radius: 8px;\n  max-width: 85%;\n}\n.message.user[data-v-e243a5fe] {\n  background: var(--q-primary, #1976d2);\n  color: white;\n  margin-left: auto;\n}\n.message.assistant[data-v-e243a5fe] {\n  background: #f0f0f0;\n  color: #222;\n  margin-right: auto;\n}\n.message-role[data-v-e243a5fe] {\n  font-size: 11px;\n  font-weight: 600;\n  margin-bottom: 2px;\n  opacity: 0.7;\n}\n.message-content[data-v-e243a5fe] {\n  white-space: pre-wrap;\n  word-break: break-word;\n  font-size: 14px;\n  line-height: 1.5;\n}\n.streaming-indicator[data-v-e243a5fe] {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 4px 12px;\n  font-size: 12px;\n  color: #888;\n}\n.input-area[data-v-e243a5fe] {\n  padding: 8px 12px;\n  border-top: 1px solid #e0e0e0;\n}\n\n.chat-context[data-v-16c2d139] {\n  padding: 8px;\n  height: 100%;\n  overflow-y: auto;\n}\n.section-header[data-v-16c2d139] {\n  font-size: 13px;\n  font-weight: 600;\n  margin-bottom: 8px;\n  color: #555;\n}"));
      document.head.appendChild(elementStyle);
    }
  } catch (e) {
    console.error("vite-plugin-css-injected-by-js", e);
  }
})();
var BootAIChat = (function(vue, pinia) {
  "use strict";
  const STORAGE_KEY = "bootai-chat-plugin";
  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
  function defaultEndpoint() {
    return {
      id: "default-bootai",
      name: "Dell E6510",
      url: "http://192.168.0.101:8080/v1",
      model: "bootai-smollm2-135m",
      apiKey: "",
      temperature: 0.7,
      maxTokens: 256
    };
  }
  const useBootaiStore = pinia.defineStore("bootai-chat", () => {
    const endpoints = vue.ref([defaultEndpoint()]);
    const activeEndpointId = vue.ref("default-bootai");
    const conversations = vue.ref([]);
    const activeConversationId = vue.ref(null);
    const isStreaming = vue.ref(false);
    const streamingContent = vue.ref("");
    const streamStartTime = vue.ref(0);
    const connectionStatus = vue.ref({});
    const abortController = vue.ref(null);
    const activeEndpoint = vue.computed(
      () => endpoints.value.find((e) => e.id === activeEndpointId.value) ?? endpoints.value[0]
    );
    const endpointConversations = vue.computed(
      () => conversations.value.filter((c) => c.endpointId === activeEndpointId.value).sort((a, b) => b.createdAt - a.createdAt)
    );
    const activeConversation = vue.computed(
      () => conversations.value.find((c) => c.id === activeConversationId.value) ?? null
    );
    function persist() {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            endpoints: endpoints.value,
            activeEndpointId: activeEndpointId.value,
            conversations: conversations.value,
            activeConversationId: activeConversationId.value
          })
        );
      } catch {
      }
    }
    function loadFromStorage() {
      var _a;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        if ((_a = data.endpoints) == null ? void 0 : _a.length) endpoints.value = data.endpoints;
        if (data.activeEndpointId) activeEndpointId.value = data.activeEndpointId;
        if (data.conversations) conversations.value = data.conversations;
        if (data.activeConversationId) activeConversationId.value = data.activeConversationId;
      } catch {
      }
    }
    function addEndpoint(ep) {
      const newEp = { ...ep, id: genId() };
      endpoints.value.push(newEp);
      persist();
      return newEp;
    }
    function updateEndpoint(id, updates) {
      const ep = endpoints.value.find((e) => e.id === id);
      if (ep) {
        Object.assign(ep, updates);
        persist();
      }
    }
    function removeEndpoint(id) {
      var _a;
      endpoints.value = endpoints.value.filter((e) => e.id !== id);
      conversations.value = conversations.value.filter((c) => c.endpointId !== id);
      if (activeEndpointId.value === id && endpoints.value.length) {
        activeEndpointId.value = endpoints.value[0].id;
      }
      if (activeConversationId.value && !conversations.value.find((c) => c.id === activeConversationId.value)) {
        activeConversationId.value = ((_a = endpointConversations.value[0]) == null ? void 0 : _a.id) ?? null;
      }
      persist();
    }
    function switchEndpoint(id) {
      activeEndpointId.value = id;
      const epConvos = conversations.value.filter((c) => c.endpointId === id);
      activeConversationId.value = epConvos.length ? epConvos.sort((a, b) => b.createdAt - a.createdAt)[0].id : null;
      persist();
    }
    function newConversation() {
      const conv = {
        id: genId(),
        endpointId: activeEndpointId.value,
        title: "New Chat",
        messages: [],
        createdAt: Date.now()
      };
      conversations.value.push(conv);
      activeConversationId.value = conv.id;
      persist();
      return conv;
    }
    function deleteConversation(id) {
      var _a;
      conversations.value = conversations.value.filter((c) => c.id !== id);
      if (activeConversationId.value === id) {
        activeConversationId.value = ((_a = endpointConversations.value[0]) == null ? void 0 : _a.id) ?? null;
      }
      persist();
    }
    function switchConversation(id) {
      activeConversationId.value = id;
      persist();
    }
    function abortStream() {
      if (abortController.value) {
        abortController.value.abort();
        abortController.value = null;
      }
      isStreaming.value = false;
    }
    async function sendMessage(content) {
      var _a, _b, _c;
      let conv = activeConversation.value;
      if (!conv) conv = newConversation();
      const userMsg = { role: "user", content, timestamp: Date.now() };
      conv.messages.push(userMsg);
      if (conv.title === "New Chat" && content.length > 0) {
        conv.title = content.slice(0, 40) + (content.length > 40 ? "..." : "");
      }
      const assistantMsg = { role: "assistant", content: "", timestamp: Date.now() };
      conv.messages.push(assistantMsg);
      isStreaming.value = true;
      streamingContent.value = "";
      streamStartTime.value = Date.now();
      const ep = activeEndpoint.value;
      const ac = new AbortController();
      abortController.value = ac;
      try {
        const baseUrl = ep.url.replace(/\/+$/, "");
        const url = `${baseUrl}/chat/completions`;
        const headers = { "Content-Type": "application/json" };
        if (ep.apiKey) headers["Authorization"] = `Bearer ${ep.apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers,
          signal: ac.signal,
          body: JSON.stringify({
            model: ep.model,
            messages: conv.messages.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
            temperature: ep.temperature,
            max_tokens: ep.maxTokens,
            stream: true
          })
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errText}`);
        }
        if (!res.body) throw new Error("No response body");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (ac.signal.aborted) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);
            if (data === "[DONE]") continue;
            try {
              const chunk = JSON.parse(data);
              const delta = (_c = (_b = (_a = chunk.choices) == null ? void 0 : _a[0]) == null ? void 0 : _b.delta) == null ? void 0 : _c.content;
              if (delta) {
                streamingContent.value += delta;
                assistantMsg.content = streamingContent.value;
              }
            } catch {
            }
          }
        }
      } catch (err) {
        if (err.name === "AbortError") {
          assistantMsg.content = streamingContent.value || "[Aborted]";
        } else {
          assistantMsg.content = streamingContent.value ? streamingContent.value + `

[Error: ${err.message}]` : `Error: ${err.message || err}`;
        }
      } finally {
        isStreaming.value = false;
        streamingContent.value = "";
        abortController.value = null;
        persist();
      }
    }
    async function testConnection(endpointId) {
      const ep = endpoints.value.find((e) => e.id === endpointId);
      if (!ep) return false;
      connectionStatus.value[endpointId] = "idle";
      try {
        const baseUrl = ep.url.replace(/\/+$/, "");
        const headers = {};
        if (ep.apiKey) headers["Authorization"] = `Bearer ${ep.apiKey}`;
        const res = await fetch(`${baseUrl}/models`, { headers, signal: AbortSignal.timeout(5e3) });
        connectionStatus.value[endpointId] = res.ok ? "ok" : "error";
        return res.ok;
      } catch {
        connectionStatus.value[endpointId] = "error";
        return false;
      }
    }
    return {
      endpoints,
      activeEndpointId,
      conversations,
      activeConversationId,
      isStreaming,
      streamingContent,
      streamStartTime,
      connectionStatus,
      activeEndpoint,
      endpointConversations,
      activeConversation,
      loadFromStorage,
      addEndpoint,
      updateEndpoint,
      removeEndpoint,
      switchEndpoint,
      newConversation,
      deleteConversation,
      switchConversation,
      sendMessage,
      testConnection,
      abortStream,
      persist
    };
  });
  const _hoisted_1$2 = { class: "chat-nav" };
  const _sfc_main$2 = /* @__PURE__ */ vue.defineComponent({
    __name: "ChatNav",
    setup(__props) {
      const store = useBootaiStore();
      const endpointOptions = vue.computed(
        () => store.endpoints.map((ep) => ({ label: ep.name, value: ep.id }))
      );
      return (_ctx, _cache) => {
        const _component_q_select = vue.resolveComponent("q-select");
        const _component_q_btn = vue.resolveComponent("q-btn");
        const _component_q_separator = vue.resolveComponent("q-separator");
        const _component_q_item_label = vue.resolveComponent("q-item-label");
        const _component_q_item_section = vue.resolveComponent("q-item-section");
        const _component_q_item = vue.resolveComponent("q-item");
        const _component_q_list = vue.resolveComponent("q-list");
        return vue.openBlock(), vue.createElementBlock("div", _hoisted_1$2, [
          vue.createVNode(_component_q_select, {
            modelValue: vue.unref(store).activeEndpointId,
            "onUpdate:modelValue": [
              _cache[0] || (_cache[0] = ($event) => vue.unref(store).activeEndpointId = $event),
              _cache[1] || (_cache[1] = ($event) => vue.unref(store).switchEndpoint($event))
            ],
            options: endpointOptions.value,
            "option-value": "value",
            "option-label": "label",
            "emit-value": "",
            "map-options": "",
            dense: "",
            outlined: "",
            label: "Endpoint",
            class: "q-mb-sm"
          }, null, 8, ["modelValue", "options"]),
          vue.createVNode(_component_q_btn, {
            label: "New Chat",
            icon: "add",
            color: "primary",
            dense: "",
            flat: "",
            class: "full-width q-mb-sm",
            onClick: _cache[2] || (_cache[2] = ($event) => vue.unref(store).newConversation())
          }),
          vue.createVNode(_component_q_separator, { class: "q-mb-sm" }),
          vue.createVNode(_component_q_list, { dense: "" }, {
            default: vue.withCtx(() => [
              (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(vue.unref(store).endpointConversations, (conv) => {
                return vue.openBlock(), vue.createBlock(_component_q_item, {
                  key: conv.id,
                  clickable: "",
                  active: conv.id === vue.unref(store).activeConversationId,
                  "active-class": "bg-primary text-white",
                  onClick: ($event) => vue.unref(store).switchConversation(conv.id)
                }, {
                  default: vue.withCtx(() => [
                    vue.createVNode(_component_q_item_section, null, {
                      default: vue.withCtx(() => [
                        vue.createVNode(_component_q_item_label, { lines: "1" }, {
                          default: vue.withCtx(() => [
                            vue.createTextVNode(vue.toDisplayString(conv.title), 1)
                          ]),
                          _: 2
                        }, 1024),
                        vue.createVNode(_component_q_item_label, {
                          caption: "",
                          lines: "1"
                        }, {
                          default: vue.withCtx(() => [
                            vue.createTextVNode(vue.toDisplayString(conv.messages.length) + " messages ", 1)
                          ]),
                          _: 2
                        }, 1024)
                      ]),
                      _: 2
                    }, 1024),
                    vue.createVNode(_component_q_item_section, { side: "" }, {
                      default: vue.withCtx(() => [
                        vue.createVNode(_component_q_btn, {
                          icon: "delete",
                          flat: "",
                          dense: "",
                          round: "",
                          size: "sm",
                          onClick: vue.withModifiers(($event) => vue.unref(store).deleteConversation(conv.id), ["stop"])
                        }, null, 8, ["onClick"])
                      ]),
                      _: 2
                    }, 1024)
                  ]),
                  _: 2
                }, 1032, ["active", "onClick"]);
              }), 128)),
              !vue.unref(store).endpointConversations.length ? (vue.openBlock(), vue.createBlock(_component_q_item, { key: 0 }, {
                default: vue.withCtx(() => [
                  vue.createVNode(_component_q_item_section, null, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_q_item_label, { class: "text-grey" }, {
                        default: vue.withCtx(() => [..._cache[3] || (_cache[3] = [
                          vue.createTextVNode("No conversations yet", -1)
                        ])]),
                        _: 1
                      })
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              })) : vue.createCommentVNode("", true)
            ]),
            _: 1
          })
        ]);
      };
    }
  });
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const ChatNav = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-92c9d6d4"]]);
  const _hoisted_1$1 = { class: "chat-main" };
  const _hoisted_2$1 = { class: "message-role" };
  const _hoisted_3$1 = ["textContent"];
  const _hoisted_4 = {
    key: 0,
    class: "streaming-indicator"
  };
  const _hoisted_5 = {
    key: 1,
    class: "empty-state"
  };
  const _hoisted_6 = { class: "input-area" };
  const _sfc_main$1 = /* @__PURE__ */ vue.defineComponent({
    __name: "ChatMain",
    setup(__props) {
      const store = useBootaiStore();
      const inputText = vue.ref("");
      const messageList = vue.ref(null);
      const elapsed = vue.computed(() => {
        if (!store.isStreaming || !store.streamStartTime) return 0;
        return Math.round((Date.now() - store.streamStartTime) / 1e3);
      });
      let elapsedTimer = null;
      const elapsedTick = vue.ref(0);
      vue.watch(() => store.isStreaming, (streaming) => {
        if (streaming) {
          elapsedTimer = setInterval(() => elapsedTick.value++, 1e3);
        } else {
          if (elapsedTimer) clearInterval(elapsedTimer);
          elapsedTick.value = 0;
        }
      });
      vue.onUnmounted(() => {
        if (elapsedTimer) clearInterval(elapsedTimer);
      });
      function scrollToBottom() {
        vue.nextTick(() => {
          if (messageList.value) {
            messageList.value.scrollTop = messageList.value.scrollHeight;
          }
        });
      }
      vue.watch(
        () => {
          var _a;
          return (_a = store.activeConversation) == null ? void 0 : _a.messages.length;
        },
        () => scrollToBottom()
      );
      vue.watch(
        () => store.streamingContent,
        () => scrollToBottom()
      );
      function onKeydown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          send();
        }
      }
      async function send() {
        const text = inputText.value.trim();
        if (!text || store.isStreaming) return;
        inputText.value = "";
        await store.sendMessage(text);
      }
      return (_ctx, _cache) => {
        const _component_q_spinner_dots = vue.resolveComponent("q-spinner-dots");
        const _component_q_icon = vue.resolveComponent("q-icon");
        const _component_q_btn = vue.resolveComponent("q-btn");
        const _component_q_input = vue.resolveComponent("q-input");
        return vue.openBlock(), vue.createElementBlock("div", _hoisted_1$1, [
          vue.createElementVNode("div", {
            ref_key: "messageList",
            ref: messageList,
            class: "message-list"
          }, [
            vue.unref(store).activeConversation ? (vue.openBlock(), vue.createElementBlock(vue.Fragment, { key: 0 }, [
              (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(vue.unref(store).activeConversation.messages, (msg, i) => {
                return vue.openBlock(), vue.createElementBlock("div", {
                  key: i,
                  class: vue.normalizeClass(["message", msg.role])
                }, [
                  vue.createElementVNode("div", _hoisted_2$1, vue.toDisplayString(msg.role === "user" ? "You" : vue.unref(store).activeEndpoint.name), 1),
                  vue.createElementVNode("div", {
                    class: "message-content",
                    textContent: vue.toDisplayString(msg.content || (vue.unref(store).isStreaming && i === vue.unref(store).activeConversation.messages.length - 1 ? "" : "..."))
                  }, null, 8, _hoisted_3$1)
                ], 2);
              }), 128)),
              vue.unref(store).isStreaming ? (vue.openBlock(), vue.createElementBlock("div", _hoisted_4, [
                vue.createVNode(_component_q_spinner_dots, { size: "16px" }),
                vue.createElementVNode("span", null, "Streaming... (" + vue.toDisplayString(elapsed.value) + "s)", 1)
              ])) : vue.createCommentVNode("", true)
            ], 64)) : (vue.openBlock(), vue.createElementBlock("div", _hoisted_5, [
              vue.createVNode(_component_q_icon, {
                name: "smart_toy",
                size: "48px",
                color: "grey-5"
              }),
              _cache[2] || (_cache[2] = vue.createElementVNode("div", { class: "text-grey q-mt-sm" }, " Start a new conversation or select one from the sidebar ", -1))
            ]))
          ], 512),
          vue.createElementVNode("div", _hoisted_6, [
            vue.createVNode(_component_q_input, {
              modelValue: inputText.value,
              "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => inputText.value = $event),
              outlined: "",
              dense: "",
              autogrow: "",
              placeholder: "Type a message...",
              disable: vue.unref(store).isStreaming,
              onKeydown
            }, {
              append: vue.withCtx(() => [
                vue.unref(store).isStreaming ? (vue.openBlock(), vue.createBlock(_component_q_btn, {
                  key: 0,
                  icon: "stop",
                  flat: "",
                  dense: "",
                  round: "",
                  color: "negative",
                  onClick: _cache[0] || (_cache[0] = ($event) => vue.unref(store).abortStream())
                })) : (vue.openBlock(), vue.createBlock(_component_q_btn, {
                  key: 1,
                  icon: "send",
                  flat: "",
                  dense: "",
                  round: "",
                  color: "primary",
                  disable: !inputText.value.trim(),
                  onClick: send
                }, null, 8, ["disable"]))
              ]),
              _: 1
            }, 8, ["modelValue", "disable"])
          ])
        ]);
      };
    }
  });
  const ChatMain = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-e243a5fe"]]);
  const _hoisted_1 = { class: "chat-context" };
  const _hoisted_2 = { class: "row q-gutter-xs q-mb-sm" };
  const _hoisted_3 = { class: "row q-gutter-xs q-mt-sm" };
  const _sfc_main = /* @__PURE__ */ vue.defineComponent({
    __name: "ChatContext",
    setup(__props) {
      const store = useBootaiStore();
      const editName = vue.ref("");
      const editUrl = vue.ref("");
      const editModel = vue.ref("");
      const editApiKey = vue.ref("");
      const editTemp = vue.ref(0.7);
      const editMaxTokens = vue.ref(256);
      const showAddForm = vue.ref(false);
      const newName = vue.ref("");
      const newUrl = vue.ref("");
      const newModel = vue.ref("");
      const newApiKey = vue.ref("");
      const isTesting = vue.ref(false);
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
      vue.watch(() => store.activeEndpointId, loadFromEndpoint, { immediate: true });
      let saveTimeout = null;
      function saveEndpoint() {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          store.updateEndpoint(store.activeEndpointId, {
            name: editName.value,
            url: editUrl.value,
            model: editModel.value,
            apiKey: editApiKey.value,
            temperature: editTemp.value,
            maxTokens: editMaxTokens.value
          });
        }, 300);
      }
      const connStatus = vue.computed(() => store.connectionStatus[store.activeEndpointId] ?? "idle");
      const statusColor = vue.computed(() => {
        if (connStatus.value === "ok") return "positive";
        if (connStatus.value === "error") return "negative";
        return "primary";
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
          model: newModel.value || "default",
          apiKey: newApiKey.value,
          temperature: 0.7,
          maxTokens: 256
        });
        store.switchEndpoint(ep.id);
        showAddForm.value = false;
        newName.value = "";
        newUrl.value = "";
        newModel.value = "";
        newApiKey.value = "";
      }
      return (_ctx, _cache) => {
        const _component_q_input = vue.resolveComponent("q-input");
        const _component_q_separator = vue.resolveComponent("q-separator");
        const _component_q_btn = vue.resolveComponent("q-btn");
        const _component_q_icon = vue.resolveComponent("q-icon");
        return vue.openBlock(), vue.createElementBlock("div", _hoisted_1, [
          !showAddForm.value ? (vue.openBlock(), vue.createElementBlock(vue.Fragment, { key: 0 }, [
            _cache[13] || (_cache[13] = vue.createElementVNode("div", { class: "section-header" }, "Current Endpoint", -1)),
            vue.createVNode(_component_q_input, {
              modelValue: editName.value,
              "onUpdate:modelValue": [
                _cache[0] || (_cache[0] = ($event) => editName.value = $event),
                saveEndpoint
              ],
              label: "Name",
              dense: "",
              outlined: "",
              class: "q-mb-xs"
            }, null, 8, ["modelValue"]),
            vue.createVNode(_component_q_input, {
              modelValue: editUrl.value,
              "onUpdate:modelValue": [
                _cache[1] || (_cache[1] = ($event) => editUrl.value = $event),
                saveEndpoint
              ],
              label: "URL",
              dense: "",
              outlined: "",
              class: "q-mb-xs"
            }, null, 8, ["modelValue"]),
            vue.createVNode(_component_q_input, {
              modelValue: editModel.value,
              "onUpdate:modelValue": [
                _cache[2] || (_cache[2] = ($event) => editModel.value = $event),
                saveEndpoint
              ],
              label: "Model",
              dense: "",
              outlined: "",
              class: "q-mb-xs"
            }, null, 8, ["modelValue"]),
            vue.createVNode(_component_q_input, {
              modelValue: editApiKey.value,
              "onUpdate:modelValue": [
                _cache[3] || (_cache[3] = ($event) => editApiKey.value = $event),
                saveEndpoint
              ],
              label: "API Key (optional)",
              dense: "",
              outlined: "",
              type: "password",
              class: "q-mb-xs"
            }, null, 8, ["modelValue"]),
            vue.createVNode(_component_q_separator, { class: "q-my-sm" }),
            vue.createVNode(_component_q_input, {
              modelValue: editTemp.value,
              "onUpdate:modelValue": [
                _cache[4] || (_cache[4] = ($event) => editTemp.value = $event),
                saveEndpoint
              ],
              modelModifiers: { number: true },
              label: "Temperature",
              dense: "",
              outlined: "",
              type: "number",
              step: "0.1",
              min: "0",
              max: "2",
              class: "q-mb-xs"
            }, null, 8, ["modelValue"]),
            vue.createVNode(_component_q_input, {
              modelValue: editMaxTokens.value,
              "onUpdate:modelValue": [
                _cache[5] || (_cache[5] = ($event) => editMaxTokens.value = $event),
                saveEndpoint
              ],
              modelModifiers: { number: true },
              label: "Max Tokens",
              dense: "",
              outlined: "",
              type: "number",
              step: "32",
              min: "1",
              max: "8192",
              class: "q-mb-xs"
            }, null, 8, ["modelValue"]),
            vue.createVNode(_component_q_separator, { class: "q-my-sm" }),
            vue.createElementVNode("div", _hoisted_2, [
              vue.createVNode(_component_q_btn, {
                label: "Test",
                icon: "wifi",
                dense: "",
                flat: "",
                color: statusColor.value,
                loading: isTesting.value,
                onClick: testConn,
                class: "col"
              }, null, 8, ["color", "loading"]),
              connStatus.value !== "idle" ? (vue.openBlock(), vue.createBlock(_component_q_icon, {
                key: 0,
                name: connStatus.value === "ok" ? "check_circle" : "error",
                color: connStatus.value === "ok" ? "positive" : "negative",
                size: "20px",
                class: "q-ml-xs self-center"
              }, null, 8, ["name", "color"])) : vue.createCommentVNode("", true)
            ]),
            vue.createVNode(_component_q_btn, {
              label: "Add Endpoint",
              icon: "add",
              dense: "",
              flat: "",
              color: "primary",
              class: "full-width q-mb-xs",
              onClick: _cache[6] || (_cache[6] = ($event) => showAddForm.value = true)
            }),
            vue.unref(store).endpoints.length > 1 ? (vue.openBlock(), vue.createBlock(_component_q_btn, {
              key: 0,
              label: "Delete Endpoint",
              icon: "delete",
              dense: "",
              flat: "",
              color: "negative",
              class: "full-width",
              onClick: _cache[7] || (_cache[7] = ($event) => vue.unref(store).removeEndpoint(vue.unref(store).activeEndpointId))
            })) : vue.createCommentVNode("", true)
          ], 64)) : (vue.openBlock(), vue.createElementBlock(vue.Fragment, { key: 1 }, [
            _cache[14] || (_cache[14] = vue.createElementVNode("div", { class: "section-header" }, "Add Endpoint", -1)),
            vue.createVNode(_component_q_input, {
              modelValue: newName.value,
              "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => newName.value = $event),
              label: "Name",
              dense: "",
              outlined: "",
              class: "q-mb-xs"
            }, null, 8, ["modelValue"]),
            vue.createVNode(_component_q_input, {
              modelValue: newUrl.value,
              "onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => newUrl.value = $event),
              label: "URL",
              dense: "",
              outlined: "",
              placeholder: "http://host:port/v1",
              class: "q-mb-xs"
            }, null, 8, ["modelValue"]),
            vue.createVNode(_component_q_input, {
              modelValue: newModel.value,
              "onUpdate:modelValue": _cache[10] || (_cache[10] = ($event) => newModel.value = $event),
              label: "Model",
              dense: "",
              outlined: "",
              class: "q-mb-xs"
            }, null, 8, ["modelValue"]),
            vue.createVNode(_component_q_input, {
              modelValue: newApiKey.value,
              "onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => newApiKey.value = $event),
              label: "API Key (optional)",
              dense: "",
              outlined: "",
              type: "password",
              class: "q-mb-xs"
            }, null, 8, ["modelValue"]),
            vue.createElementVNode("div", _hoisted_3, [
              vue.createVNode(_component_q_btn, {
                label: "Save",
                icon: "save",
                dense: "",
                color: "primary",
                class: "col",
                onClick: addNewEndpoint,
                disable: !newName.value || !newUrl.value
              }, null, 8, ["disable"]),
              vue.createVNode(_component_q_btn, {
                label: "Cancel",
                dense: "",
                flat: "",
                class: "col",
                onClick: _cache[12] || (_cache[12] = ($event) => showAddForm.value = false)
              })
            ])
          ], 64))
        ]);
      };
    }
  });
  const ChatContext = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-16c2d139"]]);
  const index = {
    id: "bootai-chat",
    name: "BootAI Chat",
    icon: "smart_toy",
    version: "1.0.0",
    navigationComponent: ChatNav,
    mainComponent: ChatMain,
    contextComponent: ChatContext,
    order: 50,
    onRegister() {
      const store = useBootaiStore();
      store.loadFromStorage();
    }
  };
  return index;
})(Vue, Pinia);
if (typeof exports !== "undefined" && BootAIChat) {
  exports.default = BootAIChat.default || BootAIChat;
}
if (typeof module !== "undefined" && module.exports && BootAIChat) {
  module.exports = BootAIChat.default || BootAIChat;
  module.exports.default = BootAIChat.default || BootAIChat;
}
