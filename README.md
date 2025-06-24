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

- All logic is in `lib/script.js` (well-commented)
- Styles are in `lib/style.css`
- No build step or dependencies required

## Credits

- Original creator: [davidc](https://github.com/davidc)
- Forked from: [davidc/subnets](https://github.com/davidc/subnets)
- Comments column by: [BlackthornYugen](https://github.com/BlackthornYugen)

## License

MIT License. See original project for details.
