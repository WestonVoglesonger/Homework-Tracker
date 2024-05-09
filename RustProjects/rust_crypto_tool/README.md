# Rust Crypto Tool

## Description
Rust Crypto Tool is a command-line based cryptographic utility designed to perform secure and efficient cryptographic operations. Built using Rust, it leverages the language's inherent safety and speed to offer robust features such as hashing, encryption, and decryption.

## Features
- **Hashing**: Utilize SHA-256 for hashing operations.
- **Encryption**: Symmetric encryption using AES-256-CBC.
- **Decryption**: Corresponding decryption for AES-256-CBC encrypted data.

## Getting Started

### Prerequisites
Ensure that you have Rust and Cargo installed on your system. You can install them using rustup by following the instructions here: [Install Rust](https://rustup.rs/).

### Installation
Clone the repository and build the project with the following commands:

```bash
git clone https://github.com/yourusername/rust_crypto_tool.git
cd rust_crypto_tool
cargo build --release
```

The built executable will be located in ./target/release.

## Usage

### Hashing
To compute the hash of a string:
`bashCopy code./target/release/rust_crypto_tool hash "input string"`

### Encryption
To encrypt a string with a secret key:
`bashCopy code./target/release/rust_crypto_tool encrypt --key "your_secret_key" "plaintext to encrypt"`

### Decryption
To decrypt a string with the corresponding secret key:
`bashCopy code./target/release/rust_crypto_tool decrypt --key "your_secret_key" "ciphertext to decrypt"`

Ensure that the key and the encryption algorithm used for decryption match those used during encryption.

### Examples

#### Hashing
`bashCopy code./target/release/rust_crypto_tool hash "Hello, Rust!"`

##### Output:
`bashCopy codeSHA-256 hash: abc123... [truncated]`

#### Encryption
bashCopy code./target/release/rust_crypto_tool encrypt --key "mysecretpassword" "Encrypt this text"

##### Output:
`bashCopy codeEncrypted: YWJjMTIz... [base64 encoded]`

#### Decryption
`bashCopy code./target/release/rust_crypto_tool decrypt --key "mysecretpassword" "YWJjMTIz..."`
##### Output:
`bashCopy codeDecrypted text: Encrypt this text`

## Contributing
Contributions to the Rust Crypto Tool are welcomed. To contribute:

*Fork the repository.*
Create a new branch for your feature.
Add your feature and ensure it is covered by tests.
Submit a pull request.

## Security
While the Rust Crypto Tool employs established cryptographic libraries and practices, it's crucial to conduct regular security audits and updates.
