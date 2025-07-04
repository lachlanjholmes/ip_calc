// Global state for the subnet calculator
let curNetwork = 0; // Current network address as integer
let curMask = 0; // Current network mask (CIDR bits)
let curComments = {}; // Stores comments for subnets
let rootSubnet; // Root node for subnet tree

// Handles updating the network and mask from the form
function updateNetwork() {
    const form = document.forms['calc'];
    const newNetworkStr = form.elements['network'].value;
    const newMask = parseInt(form.elements['netbits'].value);
    let newNetwork = inet_aton(newNetworkStr);

    if (newNetwork === null) {
        alert('Invalid network address entered');
        return;
    }

    // Ensure the network address is on a valid boundary
    const tmpNetwork = network_address(newNetwork, newMask);
    if (newNetwork !== tmpNetwork) {
        alert(
            `The network address entered is not on a network boundary for this mask.\nIt has been changed to ${inet_ntoa(tmpNetwork)}.`
        );
        newNetwork = tmpNetwork;
        form.elements['network'].value = inet_ntoa(tmpNetwork);
    }

    if (newMask < 0 || newMask > 32) {
        alert('The network mask you have entered is invalid');
        return;
    }

    // Handle mask changes and reset if needed
    if (curMask === 0) {
        curMask = newMask;
        curNetwork = newNetwork;
        startOver();
    } else if (
        curMask !== newMask &&
        confirm(
            `You are changing the base network from /${curMask} to /${newMask}. This will reset any changes you have made. Proceed?`
        )
    ) {
        curMask = newMask;
        curNetwork = newNetwork;
        startOver();
    } else {
        form.elements['netbits'].value = curMask;
        curNetwork = newNetwork;
        recreateTables();
    }
}

// Resets the subnet tree to a single root
function startOver() {
    rootSubnet = [0, 0, null];
    recreateTables();
}

// Rebuilds the subnet table UI
function recreateTables() {
    const calcbody = document.getElementById('calcbody');
    if (!calcbody) {
        alert('Body not found');
        return;
    }
    // Clear table
    while (calcbody.firstChild) calcbody.removeChild(calcbody.firstChild);
    updateNumChildren(rootSubnet);
    updateDepthChildren(rootSubnet);
    createRow(
        calcbody,
        rootSubnet,
        curNetwork,
        curMask,
        [curMask, rootSubnet[1], rootSubnet],
        rootSubnet[0]
    );
    document.getElementById('joinHeader').colSpan = rootSubnet[0] > 0 ? rootSubnet[0] : 1;
    document.getElementById('col_join').span = rootSubnet[0] > 0 ? rootSubnet[0] : 1;
    // Disable joins for subnets with comments
    const joinLocks = {};
    for (const addressWithMask in curComments) {
        const [addr, upperMaskToLock] = addressWithMask.split('/');
        const addressToLock = inet_aton(addr);
        for (let maskToLock = upperMaskToLock; maskToLock >= curMask; maskToLock--) {
            joinLocks[inet_ntoa(network_address(addressToLock, maskToLock)) + '/' + maskToLock] =
                true;
        }
    }
    for (const lock in joinLocks) {
        const joinElement = document.getElementById('join_' + lock);
        if (joinElement) {
            joinElement.childNodes[0].childNodes[0].onclick = null;
            joinElement.childNodes[0].childNodes[0].removeAttribute('href');
            joinElement.childNodes[0].childNodes[0].removeAttribute('title');
        }
    }
    createBookmarkHyperlink();
}

// Updates the bookmark link to reflect current state
function createBookmarkHyperlink() {
    const link = document.getElementById('saveLink');
    if (link) {
        link.href =
            `?network=${inet_ntoa(curNetwork)}&mask=${curMask}&division=${binToAscii(nodeToString(rootSubnet))}` +
            (Object.keys(curComments).length > 0
                ? `&comments=${encodeURIComponent(JSON.stringify(curComments))}`
                : '');
    }
}

// Serializes the subnet tree to a binary string
function nodeToString(node) {
    return node[2] ? '1' + nodeToString(node[2][0]) + nodeToString(node[2][1]) : '0';
}

// Encodes a binary string to a compact ASCII representation
function binToAscii(str) {
    let curOut = '',
        curBit = 0,
        curChar = 0;
    for (let i = 0; i < str.length; i++) {
        if (str.charAt(i) === '1') curChar |= 1 << curBit;
        curBit++;
        if (curBit > 3) {
            curOut += curChar.toString(16);
            curChar = 0;
            curBit = 0;
        }
    }
    if (curBit > 0) curOut += curChar.toString(16);
    return str.length + '.' + curOut;
}

// Decodes the ASCII representation back to a binary string
function asciiToBin(str) {
    const re = /([0-9]+)\.([0-9a-f]+)/;
    const res = re.exec(str);
    if (!res) return '';
    const len = parseInt(res[1], 10);
    const encoded = res[2];
    let out = '';
    for (let i = 0; i < len; i++) {
        const ch = parseInt(encoded.charAt(Math.floor(i / 4)), 16);
        const pos = i % 4;
        out += ch & (1 << pos) ? '1' : '0';
    }
    return out;
}

// Recursively creates table rows for each subnet node
function createRow(calcbody, node, address, mask, labels, depth) {
    if (node[2]) {
        // If node has children, recurse for each child
        let newlabels = labels.slice();
        newlabels.push(mask + 1, node[2][0][1], node[2][0]);
        createRow(calcbody, node[2][0], address, mask + 1, newlabels, depth - 1);
        newlabels = [];
        newlabels.push(mask + 1, node[2][1][1], node[2][1]);
        createRow(
            calcbody,
            node[2][1],
            address + subnet_addresses(mask + 1),
            mask + 1,
            newlabels,
            depth - 1
        );
    } else {
        // Create a table row for this subnet
        const newRow = document.createElement('TR');
        calcbody.appendChild(newRow);
        // Subnet address cell
        let newCell = document.createElement('TD');
        newCell.classList.add('col_subnet');
        newCell.appendChild(document.createTextNode(`${inet_ntoa(address)}/${mask}`));
        newRow.appendChild(newCell);
        let addressFirst = address;
        let addressLast = subnet_last_address(address, mask);
        let useableFirst = address + 1;
        let useableLast = addressLast - 1;
        let numHosts;
        let addressRange;
        let useableRange;
        const comment = curComments[inet_ntoa(address) + '/' + mask] || null;

        // Calculate address ranges and host counts
        if (mask == 32) {
            addressRange = inet_ntoa(addressFirst);
            useableRange = addressRange;
            numHosts = 1;
        } else {
            addressRange = inet_ntoa(addressFirst) + ' - ' + inet_ntoa(addressLast);
            if (mask == 31) {
                useableRange = addressRange;
                numHosts = 2;
            } else {
                useableRange = inet_ntoa(useableFirst) + ' - ' + inet_ntoa(useableLast);
                numHosts = 1 + useableLast - useableFirst;
            }
        }

        // Netmask cell
        newCell = document.createElement('TD');
        newCell.classList.add('col_netmask');
        newCell.appendChild(document.createTextNode(inet_ntoa(subnet_netmask(mask))));
        newRow.appendChild(newCell);

        // Range of addresses cell
        newCell = document.createElement('TD');
        newCell.classList.add('col_range');
        newCell.appendChild(document.createTextNode(addressRange));
        newRow.appendChild(newCell);

        // Useable addresses cell
        newCell = document.createElement('TD');
        newCell.classList.add('col_useable');
        newCell.appendChild(document.createTextNode(useableRange));
        newRow.appendChild(newCell);

        // Hosts cell
        newCell = document.createElement('TD');
        newCell.classList.add('col_hosts');
        newCell.appendChild(document.createTextNode(numHosts));
        newRow.appendChild(newCell);

        // AWS CloudFormation cell
        const awsCidrBits = 32 - mask;
        const awsCount = Math.pow(2, mask - curMask);
        const awsIPBlock = inet_ntoa(curNetwork) + '/' + curMask;
        const awsSubnet = inet_ntoa(address);
        const supernetAddress = inet_ntoa(curNetwork);
        const subnetMask = mask;
        const supernetMask = curMask;
        const awsSelect = findAwsSubnetIndex(awsSubnet, supernetAddress, subnetMask, supernetMask);

        newCell = document.createElement('TD');
        newCell.classList.add('col_cloudformation');
        if (mask > 28) {
            // AWS does not allow subnets smaller than /28
            const link = document.createElement('a');
            link.href =
                'https://docs.aws.amazon.com/vpc/latest/userguide/subnet-sizing.html#subnet-sizing-ipv4';
            link.target = '_blank';
            link.appendChild(
                document.createTextNode('Cannot create subnet with Mask greater than /28')
            );
            newCell.appendChild(link);
        } else if (awsCount > 256) {
            // AWS CIDR range limit
            const awslimit = document.createElement('awslimit');
            awslimit.title = 'AWS CIDR range limit';
            document.body.appendChild(awslimit);
            const anchor = document.createElement('a');
            anchor.href =
                'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-cidr.html#count';
            anchor.appendChild(
                document.createTextNode('Hardcode the Value: ' + (awsSubnet + '/' + mask))
            );
            awslimit.appendChild(anchor);
            newCell.appendChild(awslimit);
        } else {
            newCell.appendChild(
                document.createTextNode(
                    '!Select [ ' +
                        awsSelect +
                        ', !Cidr [ ' +
                        '"' +
                        awsIPBlock +
                        '"' +
                        ' , ' +
                        awsCount +
                        ' , ' +
                        awsCidrBits +
                        ' ]]'
                )
            );
        }
        newRow.appendChild(newCell);

        // Terraform cell
        const tfIPBlock = inet_ntoa(curNetwork) + '/' + curMask;
        const tfNewBits = mask - curMask;
        newCell = document.createElement('TD');
        newCell.classList.add('col_terraform');
        newCell.appendChild(
            document.createTextNode(
                'cidrsubnet( "' + tfIPBlock + '", ' + tfNewBits + ', ' + awsSelect + ' )'
            )
        );
        newRow.appendChild(newCell);

        // Comments cell with textarea
        newCell = document.createElement('TD');
        const textarea = document.createElement('TEXTAREA');
        textarea.id = 'comment_' + inet_ntoa(network_address(address, mask)) + '/' + mask;
        textarea.onchange = ((mask, address) =>
            function () {
                let key = inet_ntoa(address) + '/' + mask;
                let needToRedraw = false;

                if (this.value == null || this.value === '') {
                    needToRedraw = curComments[key] !== undefined;
                    delete curComments[key];
                } else {
                    needToRedraw = curComments[key] === undefined;
                    curComments[key] = this.value;
                }

                if (needToRedraw) {
                    recreateTables();
                    // Restore previous focus after redrawing table
                    document.getElementById(this.id).focus();
                } else {
                    // Just update link if we don't need to redraw.
                    createBookmarkHyperlink();
                }
            })(mask, address); // keep some vars in scope

        newCell.classList.add('col_comments');
        textarea.innerText = comment;
        newCell.appendChild(textarea);
        newRow.appendChild(newCell);

        // Divide/join actions
        newCell = document.createElement('TD');
        newRow.appendChild(newCell);

        if (mask == 32 || comment != null) {
            // Disable divide if mask is /32 or there is a comment
            const newLink = document.createElement('SPAN');
            newLink.className = 'disabledAction';
            newLink.appendChild(document.createTextNode('Divide'));
            newCell.appendChild(newLink);
        } else {
            // Allow divide
            const newLink = document.createElement('A');
            newLink.href = '#';
            newLink.onclick = function () {
                divide(node);
                return false;
            };
            newLink.appendChild(document.createTextNode('Divide'));
            newCell.appendChild(newLink);
        }
        newCell.classList.add('col_divide');

        let colspan = depth - node[0];

        // Add join cells for merging subnets
        for (let i = labels.length / 3 - 1; i >= 0; i--) {
            const mask = labels[i * 3];
            const rowspan = labels[i * 3 + 1];
            const joinnode = labels[i * 3 + 2];

            const newCell = document.createElement('TD');
            newCell.classList.add('col_join');
            newCell.rowSpan = rowspan > 1 ? rowspan : 1;
            newCell.colSpan = colspan > 1 ? colspan : 1;
            newCell.id = 'join_' + inet_ntoa(network_address(address, mask)) + '/' + mask;
            const newDivision = document.createElement('div');
            const newLink = document.createElement('a');

            if (i == labels.length / 3 - 1 || comment != null) {
                newCell.classList.add('maskSpan');
                newCell.classList.add('disabledAction');
            } else {
                newCell.classList.add('maskSpan');
                newLink.onclick = newJoin(joinnode);
                newLink.title = 'Merge this /' + mask + ' subnet together';
                newLink.href = '#';
            }
            newLink.innerText = '/' + mask;
            newDivision.appendChild(newLink);
            newCell.appendChild(newDivision);
            newRow.appendChild(newCell);

            colspan = 1; // reset for subsequent cells
        }
    }
}

// Returns a function to join a subnet node
function newJoin(joinnode) {
    return function () {
        join(joinnode);
        return false;
    };
}

// Splits a subnet node into two children
function divide(node) {
    node[2] = [
        [0, 0, null],
        [0, 0, null],
    ];
    recreateTables();
}

// Merges a subnet node (removes children)
function join(node) {
    node[2] = null;
    recreateTables();
}

// Updates the number of children for a node
function updateNumChildren(node) {
    if (!node[2]) {
        node[1] = 0;
        return 1;
    } else {
        node[1] = updateNumChildren(node[2][0]) + updateNumChildren(node[2][1]);
        return node[1];
    }
}

// Updates the depth of children for a node
function updateDepthChildren(node) {
    if (!node[2]) {
        node[0] = 0;
        return 1;
    } else {
        node[0] = updateDepthChildren(node[2][0]) + updateDepthChildren(node[2][1]);
        return node[1];
    }
}

// Converts an integer IP to dotted decimal string
function inet_ntoa(addrint) {
    return [24, 16, 8, 0].map((shift) => (addrint >> shift) & 0xff).join('.');
}

// Converts a dotted decimal IP string to integer
function inet_aton(addrstr) {
    const re = /^([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/;
    const res = re.exec(addrstr);
    if (!res) return null;
    for (let i = 1; i <= 4; i++) {
        if (res[i] < 0 || res[i] > 255) return null;
    }
    return (res[1] << 24) | (res[2] << 16) | (res[3] << 8) | Number(res[4]);
}

// Returns the network address for a given IP and mask
function network_address(ip, mask) {
    for (let i = 31 - mask; i >= 0; i--) {
        ip &= ~(1 << i);
    }
    return ip;
}

// Returns the number of addresses in a subnet
function subnet_addresses(mask) {
    return 2 ** (32 - mask);
}

// Returns the last address in a subnet
function subnet_last_address(subnet, mask) {
    return subnet + subnet_addresses(mask) - 1;
}

// Returns the netmask as an integer for a given mask
function subnet_netmask(mask) {
    return network_address(0xffffffff, mask);
}

// Called on window load to initialize the calculator
function calcOnLoad() {
    let delayMultiplier = 1;
    for (const columnName of 'subnet,netmask,range,useable,hosts,cloudformation,terraform,comments,divide,join'.split(
        ','
    )) {
        const toggleThisElement = (name) => clickElement('cb_' + name);
        const boundEvent = toggleThisElement.bind(null, columnName);
        window.setTimeout(boundEvent, delayMultiplier * 25);
        window.setTimeout(boundEvent, delayMultiplier++ * 25 + 100);
    }
    const args = parseQueryString();
    if (args['network'] && args['mask'] && args['division']) {
        document.forms['calc'].elements['network'].value = args['network'];
        document.forms['calc'].elements['netbits'].value = args['mask'];
        curComments = args['comments'] ? JSON.parse(args['comments']) : {};
        if (args['comments']) document.getElementById('cb_comments').checked = true;
        updateNetwork();
        const division = asciiToBin(args['division']);
        rootSubnet = [0, 0, null];
        if (division !== '0') loadNode(rootSubnet, division);
        recreateTables();
    } else {
        updateNetwork();
    }
}

// Loads a subnet tree from a binary string
function loadNode(curNode, division) {
    if (division.charAt(0) === '0') {
        return division.substr(1);
    } else {
        curNode[2] = [
            [0, 0, null],
            [0, 0, null],
        ];
        division = loadNode(curNode[2][0], division.substr(1));
        division = loadNode(curNode[2][1], division);
        return division;
    }
}

// Parses the query string into an object
function parseQueryString(str) {
    str = str || location.search;
    const query = str.charAt(0) === '?' ? str.substring(1) : str;
    const args = {};
    if (query) {
        for (const field of query.split('&')) {
            const [key, value] = field.split('=');
            args[unescape(key.replace(/\+/g, ' '))] = unescape(value.replace(/\+/g, ' '));
        }
    }
    return args;
}

// Initialize calculator on window load
window.onload = calcOnLoad;

// Call handleIacTypeChange on load to set initial state
window.addEventListener('load', handleIacTypeChange);

// Toggles the visibility of a column in the table
let lastCloudFormationFormat = 'yaml'; // Stores the last selected format for CloudFormation

// Handles changes in the IaC type selection
function handleIacTypeChange() {
    const iacTypeSelect = document.getElementById('iacType');
    const outputFormatSelect = document.getElementById('outputFormat');
    const outputFormatLabel = outputFormatSelect.previousElementSibling; // The label for the select

    if (iacTypeSelect.value === 'terraform') {
        // Save the current CloudFormation format before switching
        if (outputFormatSelect.value === 'json' || outputFormatSelect.value === 'yaml') {
            lastCloudFormationFormat = outputFormatSelect.value;
        }
        outputFormatSelect.style.display = 'none';
        outputFormatLabel.style.display = 'none';
        // Set a default value, though it won't be used for HCL
        outputFormatSelect.value = 'yaml';

        // Show Cloud Provider dropdown and Hardcode CIDR checkbox
        document.getElementById('cloudProvider').style.display = 'inline-block';
        document.getElementById('cloudProviderLabel').style.display = 'inline-block';
        document.getElementById('hardcodeCidr').style.display = 'inline-block';
        document.querySelector('label[for="hardcodeCidr"]').style.display = 'inline-block';
    } else if (iacTypeSelect.value === 'cloudformation') {
        outputFormatSelect.style.display = 'inline-block';
        outputFormatLabel.style.display = 'inline-block';
        outputFormatSelect.value = lastCloudFormationFormat;

        // Hide Cloud Provider dropdown and show Hardcode CIDR checkbox
        document.getElementById('cloudProvider').style.display = 'none';
        document.getElementById('cloudProviderLabel').style.display = 'none';
        document.getElementById('hardcodeCidr').style.display = 'inline-block';
        document.querySelector('label[for="hardcodeCidr"]').style.display = 'inline-block';
    }
}

// Generates IaC output based on selected type and format
window.generateIac = generateIac;
function generateIac() {
    const iacType = document.getElementById('iacType').value;
    const outputFormat = document.getElementById('outputFormat').value;
    const iacOutput = document.getElementById('iacOutput');

    let output = {};

    if (iacType === 'cloudformation') {
        output = generateCloudFormation();
        if (outputFormat === 'json') {
            iacOutput.value = JSON.stringify(output, null, 2);
        } else if (outputFormat === 'yaml') {
            iacOutput.value = jsonToYaml(output);
        }
    } else if (iacType === 'terraform') {
        iacOutput.value = generateTerraform();
    }
}

// Generates CloudFormation output
function generateCloudFormation() {
    const resources = {};
    const hardcodeCidr = document.getElementById('hardcodeCidr').checked;

    for (const addressWithMask in curComments) {
        const comment = curComments[addressWithMask];
        const [address, mask] = addressWithMask.split('/');
        const subnetAddress = inet_aton(address);
        const subnetMask = parseInt(mask);

        // Generate a valid CloudFormation resource name from the comment
        const resourceName = comment.replace(/[^a-zA-Z0-9]/g, '');

        // Find the AWS subnet index
        const awsSelect = findAwsSubnetIndex(address, inet_ntoa(curNetwork), subnetMask, curMask);
        const awsCidrBits = 32 - subnetMask;
        const awsCount = Math.pow(2, subnetMask - curMask);
        const awsIPBlock = inet_ntoa(curNetwork) + '/' + curMask;

        let cidrBlockValue;
        if (hardcodeCidr) {
            cidrBlockValue = `${inet_ntoa(subnetAddress)}/${subnetMask}`;
        } else {
            cidrBlockValue = {
                'Fn::Select': [awsSelect, { 'Fn::Cidr': [awsIPBlock, awsCount, awsCidrBits] }],
            };
        }

        // CloudFormation Subnet resource structure
        resources[resourceName] = {
            Type: 'AWS::EC2::Subnet',
            Properties: {
                VpcId: { 'Fn::Select': [0, { Ref: 'VPC' }] }, // Assuming a VPC resource named "VPC"
                CidrBlock: cidrBlockValue,
                AvailabilityZone: 'us-east-1a', // Placeholder AZ
                Tags: [{ Key: 'Name', Value: resourceName }],
            },
        };
    }
    return {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Generated Subnets from Visual Subnet Calculator',
        Parameters: {
            VPC: {
                Type: 'List<AWS::EC2::VPC::Id>',
                Description: 'The ID of the VPC to create subnets in.',
            },
        },
        Resources: resources,
    };
}

// Generates Terraform output
function generateTerraform() {
    let hclOutput = '';
    const cloudProvider = document.getElementById('cloudProvider').value;
    const hardcodeCidr = document.getElementById('hardcodeCidr').checked;

    for (const addressWithMask in curComments) {
        const comment = curComments[addressWithMask];
        const [address, mask] = addressWithMask.split('/');
        const subnetAddress = inet_aton(address);
        const subnetMask = parseInt(mask);

        // Generate a valid Terraform resource name from the comment
        const resourceName = comment.replace(/[^a-zA-Z0-9_.-]/g, '');

        const tfIPBlock = inet_ntoa(curNetwork) + '/' + curMask;
        const tfNewBits = subnetMask - curMask;
        const awsSelect = findAwsSubnetIndex(address, inet_ntoa(curNetwork), subnetMask, curMask);

        let cidrBlockValue;
        if (hardcodeCidr) {
            cidrBlockValue = `"${inet_ntoa(subnetAddress)}/${subnetMask}"`;
        } else {
            cidrBlockValue = `cidrsubnet("${tfIPBlock}", ${tfNewBits}, ${awsSelect})`;
        }

        if (cloudProvider === 'aws') {
            hclOutput += `resource "aws_subnet" "${resourceName}" {
  vpc_id = aws_vpc.main.id
  cidr_block = ${cidrBlockValue}
  availability_zone = "us-east-1a" # Placeholder AZ

  tags = {
    Name = "${resourceName}"
  }
}

`;
        } else if (cloudProvider === 'azure') {
            hclOutput += `resource "azurerm_subnet" "${resourceName}" {
  name                 = "${resourceName}"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [${cidrBlockValue}]
}

`;
        } else if (cloudProvider === 'gcp') {
            hclOutput += `resource "google_compute_subnetwork" "${resourceName}" {
  name          = "${resourceName}"
  ip_cidr_range = ${cidrBlockValue}
  region        = "us-central1" # Placeholder Region
  network       = google_compute_network.main.id
}

`;
        }
    }
    return hclOutput;
}

// Basic JSON to YAML converter (simplified for this use case)
function jsonToYaml(json) {
    let yaml = '';
    function indent(level) {
        return '  '.repeat(level);
    }

    function processNode(node, level) {
        if (Array.isArray(node)) {
            node.forEach((item) => {
                yaml += indent(level) + '- ';
                if (typeof item === 'object' && item !== null) {
                    yaml += '\n';
                    processNode(item, level + 1);
                } else {
                    yaml += item + '\n';
                }
            });
        } else if (typeof node === 'object' && node !== null) {
            for (const key in node) {
                if (Object.prototype.hasOwnProperty.call(node, key)) {
                    yaml += indent(level) + key + ': ';
                    if (typeof node[key] === 'object' && node[key] !== null) {
                        yaml += '\n';
                        processNode(node[key], level + 1);
                    } else {
                        yaml += node[key] + '\n';
                    }
                }
            }
        } else {
            yaml += node + '\n';
        }
    }
    processNode(json, 0);
    return yaml;
}

// eslint-disable-next-line no-unused-vars
function toggleColumn(cb) {
    const cssName = '--display-' + cb.id.substr(3);
    document.documentElement.style.setProperty(cssName, cb.checked ? 'table-cell' : 'none');
    recreateTables();
}

// Simulates a click event on an element by id
function clickElement(id) {
    document
        .getElementById(id)
        .dispatchEvent(new MouseEvent('click', { view: window, bubbles: true, cancelable: true }));
}

// Calculates all subnets for a given supernet and mask
function calculateSubnets(_subnetAddress, supernetAddress, subnetMask, supernetMask) {
    const supernetParts = supernetAddress.split('.').map(Number);
    const totalSubnets = Math.pow(2, subnetMask - supernetMask);
    const subnets = [];
    let currentSubnet = [...supernetParts];
    for (let i = 0; i < totalSubnets; i++) {
        subnets.push(currentSubnet.join('.'));
        let carry = Math.floor((currentSubnet[3] + Math.pow(2, 32 - subnetMask)) / 256);
        currentSubnet[3] = (currentSubnet[3] + Math.pow(2, 32 - subnetMask)) % 256;
        currentSubnet[2] += carry;
        carry = Math.floor(currentSubnet[2] / 256);
        currentSubnet[2] %= 256;
        currentSubnet[1] += carry;
        carry = Math.floor(currentSubnet[1] / 256);
        currentSubnet[1] %= 256;
        currentSubnet[0] += carry;
    }
    return subnets;
}

// Finds the index of a subnet in the AWS subnet list
function findAwsSubnetIndex(subnetAddress, supernetAddress, subnetMask, supernetMask) {
    const subnets = calculateSubnets(subnetAddress, supernetAddress, subnetMask, supernetMask);
    const SubnetIndex = subnets.indexOf(subnetAddress);
    return SubnetIndex !== -1 ? SubnetIndex : 'Nothing Found';
}
