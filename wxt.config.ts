import { defineConfig } from "wxt"

// See https://wxt.dev/api/config.html
export default defineConfig({
  imports: false,
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    browser_specific_settings: {
      gecko: {
        data_collection_permissions: {
          required: ["none"],
        },
      },
    },
    permissions: ["storage", "tabs", "alarms", "tabGroups"],
    web_accessible_resources: [
      {
        resources: ["lib/*"],
        matches: ["<all_urls>"],
      },
    ],
    commands: {
      _execute_action: {
        suggested_key: {
          default: "Alt+T",
          mac: "MacCtrl+T",
        },
        description: "Show the popup",
      },
    },
  },
})
