# Blnk TypeScript SDK

> A Node library for consuming the Blnk API

## Prerequisites

This project requires NodeJS (version 8 or later) and NPM. [Node](http://nodejs.org/) and [NPM](https://npmjs.org/) are really easy to install. To make sure you have them available on your machine, try running the following command.

Make sure you set up your [BLNK](https://docs.blnkfinance.com/home/install) server as this SDK requires a BLNK url.

### Table of contents

- [BLNK SDK](#blnk-sdk)
- [Prerequisites](#prerequisites)
- [Table of contents](#table-of-contents)
- [Installation](#installation)
- [Usage](#usage)
- [Issues](#issues)
- [Authors](#authors)

## Installation

**BEFORE YOU INSTALL:** please read the [prerequisites](#prerequisites)

`npm install @blnkfinance/blnk-typescript --save`

## Usage

Importing and Using the SDK

#### CommonJS

```
const {BlnkInit} = require(`@blnkfinance/blnk-typescript`);
const blnk = await BlnkInit(`<secret_key_if_set>`, {
    baseUrl: BASE_URL,
});
const {Ledgers, Search, LedgerBalances, Transactions} = blnk;

const ledger = await Ledgers.create({
    name: `Marketing Department Ledger`,
    meta_data: {
      department: `Marketing`,
    },
});
```

#### Typescript

```
import {BlnkInit} from `@blnkfinance/blnk-typescript`;
const blnk = await BlnkInit(`<secret_key_if_set>`, {
    baseUrl: BASE_URL,
});

const {Ledgers, Search, LedgerBalances, Transactions} = blnk;

//meta data type can be passed as a generic type to the create method
const ledger = await Ledgers.create<{department: string}>({
    name: `Marketing Department Ledger`,
    meta_data: {
        department: `Marketing`,
    }
})

//can be called without a generic type
const ledger = await Ledgers.create({
    name: `Marketing Department Ledger`,
})
```

## Issues

Find a bug? Please create an issue [here](https://github.com/blnkfinance/blnk-ts/issues) on GitHub!

## Authors

- [@blnkfinance](https://github.com/blnkfinance)
