import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Selendra SDK",
  description: "TypeScript SDK for Selendra Blockchain Development",
  
  head: [
    ["link", { rel: "icon", type: "image/png", href: "/logo.png" }],
    ["meta", { name: "theme-color", content: "#6366f1" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:title", content: "Selendra SDK" }],
    ["meta", { property: "og:description", content: "TypeScript SDK for Selendra Blockchain Development" }],
    ["meta", { property: "og:url", content: "https://sdk.selendra.org" }],
  ],
  
  lastUpdated: true,
  cleanUrls: true,
  
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: "/logo.png",
    
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "CLI", link: "/cli/overview" },
      { text: "API", link: "/api/overview" },
      { text: "Examples", link: "/examples/overview" },
      {
        text: "Resources",
        items: [
          { text: "Block Explorer", link: "https://explorer.selendra.org" },
          { text: "Faucet", link: "https://faucet.selendra.org" },
          { text: "GitHub", link: "https://github.com/selendra/selendra-sdk" },
        ],
      },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            { text: "Getting Started", link: "/guide/getting-started" },
            { text: "Installation", link: "/guide/installation" },
            { text: "Quick Start", link: "/guide/quick-start" },
            { text: "Why Selendra?", link: "/guide/why-selendra" },
          ],
        },
        {
          text: "Core Concepts",
          items: [
            { text: "Unified Accounts", link: "/guide/unified-accounts" },
            { text: "EVM Integration", link: "/guide/evm-integration" },
            { text: "Substrate Pallets", link: "/guide/substrate-pallets" },
            { text: "Networks", link: "/guide/networks" },
          ],
        },
        {
          text: "Advanced",
          items: [
            { text: "Multicall", link: "/guide/multicall" },
            { text: "Gas Estimation", link: "/guide/gas-estimation" },
            { text: "Error Handling", link: "/guide/error-handling" },
            { text: "TypeScript Support", link: "/guide/typescript" },
          ],
        },
      ],
      "/cli/": [
        {
          text: "CLI Overview",
          items: [
            { text: "Overview", link: "/cli/overview" },
            { text: "Installation", link: "/cli/installation" },
            { text: "Configuration", link: "/cli/configuration" },
          ],
        },
        {
          text: "Project Commands",
          items: [
            { text: "init", link: "/cli/commands/init" },
            { text: "compile", link: "/cli/commands/compile" },
            { text: "deploy", link: "/cli/commands/deploy" },
            { text: "verify", link: "/cli/commands/verify" },
          ],
        },
        {
          text: "Network Commands",
          items: [
            { text: "status", link: "/cli/commands/status" },
            { text: "chain", link: "/cli/commands/chain" },
            { text: "block", link: "/cli/commands/block" },
            { text: "tx", link: "/cli/commands/tx" },
            { text: "gas", link: "/cli/commands/gas" },
            { text: "logs", link: "/cli/commands/logs" },
          ],
        },
        {
          text: "Account Commands",
          items: [
            { text: "account", link: "/cli/commands/account" },
            { text: "balance", link: "/cli/commands/balance" },
            { text: "transfer", link: "/cli/commands/transfer" },
            { text: "faucet", link: "/cli/commands/faucet" },
          ],
        },
        {
          text: "Contract Commands",
          items: [
            { text: "interact", link: "/cli/commands/interact" },
            { text: "abi", link: "/cli/commands/abi" },
          ],
        },
        {
          text: "Staking Commands",
          items: [
            { text: "stake", link: "/cli/commands/stake" },
          ],
        },
        {
          text: "Advanced",
          items: [
            { text: "learn", link: "/cli/commands/learn" },
            { text: "plugin", link: "/cli/commands/plugin" },
          ],
        },
      ],
      "/api/": [
        {
          text: "API Reference",
          items: [
            { text: "Overview", link: "/api/overview" },
          ],
        },
        {
          text: "Providers",
          items: [
            { text: "EVMProvider", link: "/api/providers/evm" },
            { text: "SubstrateProvider", link: "/api/providers/substrate" },
            { text: "UnifiedProvider", link: "/api/providers/unified" },
          ],
        },
        {
          text: "Utilities",
          items: [
            { text: "Multicall", link: "/api/utils/multicall" },
            { text: "Address Utils", link: "/api/utils/address" },
            { text: "Format Utils", link: "/api/utils/format" },
          ],
        },
        {
          text: "Errors",
          items: [
            { text: "Error Classes", link: "/api/errors" },
          ],
        },
        {
          text: "Types",
          items: [
            { text: "Type Definitions", link: "/api/types" },
          ],
        },
      ],
      "/examples/": [
        {
          text: "Examples",
          items: [
            { text: "Overview", link: "/examples/overview" },
          ],
        },
        {
          text: "Basic",
          items: [
            { text: "Connect to Network", link: "/examples/connect" },
            { text: "Check Balance", link: "/examples/balance" },
            { text: "Transfer Tokens", link: "/examples/transfer" },
          ],
        },
        {
          text: "Contracts",
          items: [
            { text: "Deploy Contract", link: "/examples/deploy-contract" },
            { text: "Interact with Contract", link: "/examples/contract-interaction" },
            { text: "ERC-20 Token", link: "/examples/erc20" },
            { text: "NFT (ERC-721)", link: "/examples/nft" },
          ],
        },
        {
          text: "Advanced",
          items: [
            { text: "Unified Accounts", link: "/examples/unified-accounts" },
            { text: "Multicall Batching", link: "/examples/multicall" },
            { text: "Event Listening", link: "/examples/events" },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/selendra/selendra-sdk" },
      { icon: "twitter", link: "https://twitter.com/selaboratory" },
      { icon: "discord", link: "https://discord.gg/selendra" },
    ],

    footer: {
      message: "Released under the Apache 2.0 License.",
      copyright: "Copyright © 2024 Selendra",
    },

    editLink: {
      pattern: "https://github.com/selendra/selendra-sdk/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },

    search: {
      provider: "local",
    },
  },
});
