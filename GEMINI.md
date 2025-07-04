# Project Guidelines for Gemini

This `GEMINI.md` file provides context and guidelines for interacting with the 'Visual Subnet Calculator' project.

## Project Overview

This is a client-side web application designed for visualizing and managing IPv4 subnets. It allows users to interactively split and join subnets, add comments, and generate output for AWS CloudFormation and Terraform.

## Technology Stack

- **Frontend:** HTML, CSS, JavaScript
- **No Backend:** All logic is client-side.

## Key Files

- `index.html`: The main entry point and user interface.
- `lib/script.js`: Contains all core application logic, including subnet calculations, UI manipulation, and data serialization.
- `lib/style.css`: Defines the visual presentation and layout.

## Development Workflow

- The project has no build step or external dependencies.
- To run, simply open `index.html` in a web browser.

## Interaction Guidelines for Gemini

- **Focus:** Prioritize changes to `lib/script.js` for functionality and `lib/style.css` for styling.
- **Client-Side Only:** All proposed solutions should be implemented purely on the client-side using HTML, CSS, and JavaScript. Do not introduce server-side components or external libraries unless explicitly requested and justified.
- **Code Style:** Adhere to the existing coding style found in `lib/script.js` and `lib/style.css`.
- **No Build Step:** Do not introduce any build tools (e.g., Webpack, Babel) or package managers (e.g., npm, yarn) unless specifically instructed.
- **Testing:** Manual testing by opening `index.html` is the primary method for verification.
- **New Feature: IaC Export:** The application now includes functionality to export subnet configurations as IaC (CloudFormation in YAML/JSON, or Terraform in HCL for AWS, Azure, or GCP). A toggle allows users to choose between hardcoded CIDR values or dynamically generated CIDR values using intrinsic functions/`cidrsubnet`. Subnet comments are used as resource names in the generated output.
