# Visual Subnet Calculator

A web-based, interactive subnet calculator for visualizing and managing IPv4 subnets. Easily split, join, and annotate subnets, with export options for AWS CloudFormation and Terraform.

## Features

- Enter a base network and mask to visualize subnets
- Split and join subnets interactively
- Show/hide columns for subnet address, netmask, range, usable IPs, hosts, AWS CloudFormation, Terraform, comments, and actions
- Add comments to individual subnets
- Export subnetting as a bookmarkable URL
- Generate AWS CloudFormation and Terraform CIDR expressions

## Usage

1. Open `index.html` in your browser (no server required)
2. Enter the network address and mask (e.g., `192.168.0.0/16`)
3. Click **Update** to visualize the subnet
4. Use the checkboxes to show/hide columns
5. Click **Divide** to split a subnet, or **Join** to merge
6. Add comments as needed
7. Bookmark the provided link to save your work

## Development

- All logic is in `lib/script.js`
- Styles are in `lib/style.css`
- No build step or dependencies required (for core functionality)

### Linting and Formatting

This project uses ESLint for linting JavaScript and Prettier for code formatting.

1.  **Install dependencies:**

    ```bash
    npm install
    ```

2.  **Run the linter (check for errors):**

    ```bash
    npm run lint
    ```

3.  **Fix linting errors automatically:**

    ```bash
    npm run lint:fix
    ```

4.  **Format the code:**

    ```bash
    npm run format
    ```

## Credits

- Original creator: [davidc](https://github.com/davidc)
- Forked from: [davidc/subnets](https://github.com/davidc/subnets)
- Comments column by: [BlackthornYugen](https://github.com/BlackthornYugen)

## License

MIT License. See original project for details.
