// IIFE to encapsulate all variables and prevent global namespace pollution
(function () {
    'use strict';

    // Shallow-compares two objects for equality (order-independent)
    function shallowEqual(a, b) {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        return keysA.every((key) => a[key] === b[key]);
    }

    // Global state for the subnet calculator
    let curNetwork = 0; // Current network address as integer
    let curMask = 0; // Current network mask (CIDR bits)
    let curComments = {}; // Stores comments for subnets
    let rootSubnet; // Root node for subnet tree

    // Handles updating the network and mask from the form
    function updateNetwork() {
        const form = document.forms['calc'];
        const newNetworkStr = form.elements['network'].value;
        const newMask = parseInt(form.elements['netbits'].value, 10);

        // Validate mask before any arithmetic
        if (isNaN(newMask) || newMask < 0 || newMask > 32) {
            alert('The network mask you have entered is invalid');
            return;
        }

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

    // Creates a new subnet tree node
    function createNode() {
        return { depth: 0, numChildren: 0, children: null };
    }

    // Resets the subnet tree to a single root
    function startOver() {
        rootSubnet = createNode();
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
            [{ mask: curMask, numChildren: rootSubnet.numChildren, node: rootSubnet }],
            rootSubnet.depth
        );
        document.getElementById('joinHeader').colSpan = rootSubnet.depth > 0 ? rootSubnet.depth : 1;
        document.getElementById('col_join').span = rootSubnet.depth > 0 ? rootSubnet.depth : 1;
        // Disable joins for subnets with comments
        const joinLocks = {};
        for (const addressWithMask of Object.keys(curComments)) {
            const [addr, upperMaskToLock] = addressWithMask.split('/');
            const addressToLock = inet_aton(addr);
            for (let maskToLock = upperMaskToLock; maskToLock >= curMask; maskToLock--) {
                joinLocks[
                    inet_ntoa(network_address(addressToLock, maskToLock)) + '/' + maskToLock
                ] = true;
            }
        }
        for (const lock of Object.keys(joinLocks)) {
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
            // Build comprehensive URL with all state
            const params = new URLSearchParams();

            // Core network parameters
            params.set('network', inet_ntoa(curNetwork));
            params.set('mask', curMask.toString());
            params.set('division', binToAscii(nodeToString(rootSubnet)));

            // Comments (if any)
            if (Object.keys(curComments).length > 0) {
                params.set('comments', JSON.stringify(curComments));
            }

            // Column visibility settings
            const columnSettings = getVisibleColumns();
            const defaultColumns = {
                subnet: true,
                netmask: true,
                range: true,
                useable: true,
                hosts: true,
                cloudformation: true,
                terraform: true,
                comments: true,
                divide: true,
                join: true,
            };

            // Only include column settings if they differ from defaults
            if (!shallowEqual(columnSettings, defaultColumns)) {
                params.set('columns', JSON.stringify(columnSettings));
            }

            // IaC settings
            const iacSettings = getIacSettings();
            const defaultIacSettings = {
                iacType: 'cloudformation',
                outputFormat: 'yaml',
                cloudProvider: 'aws',
                hardcodeCidr: false,
            };

            // Only include IaC settings if they differ from defaults
            if (!shallowEqual(iacSettings, defaultIacSettings)) {
                params.set('iac', JSON.stringify(iacSettings));
            }

            link.href = '?' + params.toString();

            // Update link text with friendly description
            const friendlyDescription = createFriendlyUrl();
            link.title = `Bookmark: ${friendlyDescription}`;
        }
    }

    // Serializes the subnet tree to a binary string
    function nodeToString(node) {
        return node.children
            ? '1' + nodeToString(node.children[0]) + nodeToString(node.children[1])
            : '0';
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

    // Helper to create a standard table cell with a class and text content
    function createCell(row, className, textContent) {
        const cell = document.createElement('TD');
        cell.classList.add(className);
        cell.appendChild(document.createTextNode(textContent));
        row.appendChild(cell);
        return cell;
    }

    // Creates the subnet info cells: subnet address, netmask, range, useable, hosts
    function createSubnetCells(row, address, mask) {
        createCell(row, 'col_subnet', `${inet_ntoa(address)}/${mask}`);

        const addressFirst = address;
        const addressLast = subnet_last_address(address, mask);
        let numHosts;
        let addressRange;
        let useableRange;

        if (mask === 32) {
            addressRange = inet_ntoa(addressFirst);
            useableRange = addressRange;
            numHosts = 1;
        } else {
            addressRange = inet_ntoa(addressFirst) + ' - ' + inet_ntoa(addressLast);
            if (mask === 31) {
                useableRange = addressRange;
                numHosts = 2;
            } else {
                const useableFirst = address + 1;
                const useableLast = addressLast - 1;
                useableRange = inet_ntoa(useableFirst) + ' - ' + inet_ntoa(useableLast);
                numHosts = 1 + useableLast - useableFirst;
            }
        }

        createCell(row, 'col_netmask', inet_ntoa(subnet_netmask(mask)));
        createCell(row, 'col_range', addressRange);
        createCell(row, 'col_useable', useableRange);
        createCell(row, 'col_hosts', numHosts);
    }

    // Creates the AWS CloudFormation cell
    function createCloudFormationCell(row, address, mask, awsSelect) {
        const awsCidrBits = 32 - mask;
        const awsCount = 2 ** (mask - curMask);
        const awsIPBlock = inet_ntoa(curNetwork) + '/' + curMask;
        const awsSubnet = inet_ntoa(address);

        const cell = document.createElement('TD');
        cell.classList.add('col_cloudformation');
        if (mask > 28) {
            const link = document.createElement('a');
            link.href =
                'https://docs.aws.amazon.com/vpc/latest/userguide/subnet-sizing.html#subnet-sizing-ipv4';
            link.target = '_blank';
            link.appendChild(
                document.createTextNode('Cannot create subnet with Mask greater than /28')
            );
            cell.appendChild(link);
        } else if (awsCount > 256) {
            const awslimit = document.createElement('span');
            awslimit.className = 'aws-limit-warning';
            awslimit.title = 'AWS CIDR range limit';
            const anchor = document.createElement('a');
            anchor.href =
                'https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-cidr.html#count';
            anchor.appendChild(
                document.createTextNode('Hardcode the Value: ' + (awsSubnet + '/' + mask))
            );
            awslimit.appendChild(anchor);
            cell.appendChild(awslimit);
        } else {
            cell.appendChild(
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
        row.appendChild(cell);
    }

    // Creates the Terraform cell
    function createTerraformCell(row, mask, awsSelect) {
        const tfIPBlock = inet_ntoa(curNetwork) + '/' + curMask;
        const tfNewBits = mask - curMask;
        createCell(
            row,
            'col_terraform',
            'cidrsubnet( "' + tfIPBlock + '", ' + tfNewBits + ', ' + awsSelect + ' )'
        );
    }

    // Creates the comment textarea cell
    function createCommentCell(row, address, mask, comment) {
        const cell = document.createElement('TD');
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
                    document.getElementById(this.id).focus();
                } else {
                    createBookmarkHyperlink();
                }
            })(mask, address);

        cell.classList.add('col_comments');
        textarea.value = comment || '';
        cell.appendChild(textarea);
        row.appendChild(cell);
    }

    // Creates the divide action cell
    function createDivideCell(row, node, mask, comment) {
        const cell = document.createElement('TD');
        row.appendChild(cell);

        if (mask === 32 || comment != null) {
            const span = document.createElement('SPAN');
            span.className = 'disabledAction';
            span.appendChild(document.createTextNode('Divide'));
            cell.appendChild(span);
        } else {
            const link = document.createElement('A');
            link.href = '#';
            link.onclick = function () {
                divide(node);
                return false;
            };
            link.appendChild(document.createTextNode('Divide'));
            cell.appendChild(link);
        }
        cell.classList.add('col_divide');
    }

    // Creates the join cells for merging subnets
    function createJoinCells(row, labels, address, depth, node, comment) {
        let colspan = depth - node.depth;

        for (let i = labels.length - 1; i >= 0; i--) {
            const labelEntry = labels[i];

            const cell = document.createElement('TD');
            cell.classList.add('col_join');
            cell.rowSpan = labelEntry.numChildren > 1 ? labelEntry.numChildren : 1;
            cell.colSpan = colspan > 1 ? colspan : 1;
            cell.id =
                'join_' +
                inet_ntoa(network_address(address, labelEntry.mask)) +
                '/' +
                labelEntry.mask;
            const div = document.createElement('div');
            const link = document.createElement('a');

            if (i === labels.length - 1 || comment != null) {
                cell.classList.add('maskSpan');
                cell.classList.add('disabledAction');
            } else {
                cell.classList.add('maskSpan');
                link.onclick = newJoin(labelEntry.node);
                link.title = 'Merge this /' + labelEntry.mask + ' subnet together';
                link.href = '#';
            }
            link.innerText = '/' + labelEntry.mask;
            div.appendChild(link);
            cell.appendChild(div);
            row.appendChild(cell);

            colspan = 1;
        }
    }

    // Recursively creates table rows for each subnet node
    function createRow(calcbody, node, address, mask, labels, depth) {
        if (node.children) {
            // If node has children, recurse for each child
            let newlabels = labels.slice();
            newlabels.push({
                mask: mask + 1,
                numChildren: node.children[0].numChildren,
                node: node.children[0],
            });
            createRow(calcbody, node.children[0], address, mask + 1, newlabels, depth - 1);
            newlabels = [];
            newlabels.push({
                mask: mask + 1,
                numChildren: node.children[1].numChildren,
                node: node.children[1],
            });
            createRow(
                calcbody,
                node.children[1],
                address + subnet_addresses(mask + 1),
                mask + 1,
                newlabels,
                depth - 1
            );
        } else {
            const newRow = document.createElement('TR');
            calcbody.appendChild(newRow);
            const comment = curComments[inet_ntoa(address) + '/' + mask] || null;

            const awsSelect = findAwsSubnetIndex(
                inet_ntoa(address),
                inet_ntoa(curNetwork),
                mask,
                curMask
            );

            createSubnetCells(newRow, address, mask);
            createCloudFormationCell(newRow, address, mask, awsSelect);
            createTerraformCell(newRow, mask, awsSelect);
            createCommentCell(newRow, address, mask, comment);
            createDivideCell(newRow, node, mask, comment);
            createJoinCells(newRow, labels, address, depth, node, comment);
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
        node.children = [createNode(), createNode()];
        recreateTables();
    }

    // Merges a subnet node (removes children)
    function join(node) {
        node.children = null;
        recreateTables();
    }

    // Updates the number of children for a node
    function updateNumChildren(node) {
        if (!node.children) {
            node.numChildren = 0;
            return 1;
        } else {
            node.numChildren =
                updateNumChildren(node.children[0]) + updateNumChildren(node.children[1]);
            return node.numChildren;
        }
    }

    // Updates the depth of children for a node
    function updateDepthChildren(node) {
        if (!node.children) {
            node.depth = 0;
            return 1;
        } else {
            node.depth =
                updateDepthChildren(node.children[0]) + updateDepthChildren(node.children[1]);
            return node.depth;
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
    // Plays the column toggle animation on fresh page load (no URL params)
    function animateColumnIntro() {
        let delayMultiplier = 1;
        const columnNames =
            'subnet,netmask,range,useable,hosts,cloudformation,terraform,comments,divide,join'.split(
                ','
            );
        for (const columnName of columnNames) {
            const toggleOff = (name) => {
                const cb = document.getElementById('cb_' + name);
                if (cb) {
                    cb.checked = false;
                    document.documentElement.style.setProperty('--display-' + name, 'none');
                }
            };
            const toggleOn = (name) => {
                const cb = document.getElementById('cb_' + name);
                if (cb) {
                    cb.checked = true;
                    document.documentElement.style.setProperty('--display-' + name, 'table-cell');
                }
            };
            window.setTimeout(toggleOff.bind(null, columnName), delayMultiplier * 25);
            window.setTimeout(toggleOn.bind(null, columnName), delayMultiplier++ * 25 + 100);
        }
        const totalAnimationTime = delayMultiplier * 25 + 100;
        window.setTimeout(recreateTables, totalAnimationTime);
    }

    // Restores full application state from URL parameters
    function restoreUrlState(args) {
        // Restore core network settings
        document.forms['calc'].elements['network'].value = args['network'];
        document.forms['calc'].elements['netbits'].value = args['mask'];

        // Restore comments
        curComments = {};
        if (args['comments']) {
            try {
                const parsedComments = JSON.parse(args['comments']);
                if (typeof parsedComments === 'object' && parsedComments !== null) {
                    curComments = parsedComments;
                }
            } catch (e) {
                console.warn('Invalid comments parameter in URL:', e);
            }
        }

        // Restore column visibility settings
        if (args['columns']) {
            try {
                const columnSettings = JSON.parse(args['columns']);
                if (typeof columnSettings === 'object' && columnSettings !== null) {
                    restoreColumnVisibility(columnSettings);
                }
            } catch (e) {
                console.warn('Invalid columns parameter in URL:', e);
            }
        } else {
            const defaultColumns = {
                subnet: true,
                netmask: true,
                range: true,
                useable: true,
                hosts: true,
                cloudformation: true,
                terraform: true,
                comments: true,
                divide: true,
                join: true,
            };
            restoreColumnVisibility(defaultColumns);
        }

        // Restore IaC settings
        if (args['iac']) {
            try {
                const iacSettings = JSON.parse(args['iac']);
                if (typeof iacSettings === 'object' && iacSettings !== null) {
                    restoreIacSettings(iacSettings);
                }
            } catch (e) {
                console.warn('Invalid IaC parameter in URL:', e);
            }
        }

        // Update network and restore subnet tree
        updateNetwork();
        const division = asciiToBin(args['division']);
        rootSubnet = createNode();
        if (division && division !== '0') {
            try {
                loadNode(rootSubnet, division);
            } catch (e) {
                console.warn('Invalid division parameter in URL, using default:', e);
                rootSubnet = createNode();
            }
        }
        recreateTables();
    }

    // Called on window load to initialize the calculator
    function calcOnLoad() {
        const args = parseQueryString();
        const hasUrlParams = args['network'] && args['mask'] && args['division'];

        if (hasUrlParams) {
            try {
                restoreUrlState(args);
            } catch (error) {
                console.error('Error restoring state from URL:', error);
                updateNetwork();
            }
        } else {
            animateColumnIntro();
            updateNetwork();
        }
    }

    // Loads a subnet tree from a binary string
    // maxDepth guards against malformed strings causing stack overflow
    function loadNode(curNode, division, depth = 0) {
        if (depth > 32) {
            console.warn(
                'loadNode: maximum recursion depth exceeded, division string may be malformed'
            );
            return division;
        }
        if (division.charAt(0) === '0') {
            return division.substring(1);
        } else {
            curNode.children = [createNode(), createNode()];
            division = loadNode(curNode.children[0], division.substring(1), depth + 1);
            division = loadNode(curNode.children[1], division, depth + 1);
            return division;
        }
    }

    // Parses the query string into an object
    function parseQueryString(str) {
        const params = new URLSearchParams(str || location.search);
        const args = {};
        for (const [key, value] of params) {
            args[key] = value;
        }
        return args;
    }

    // Registers all event handlers (replaces inline HTML event attributes)
    function registerEventListeners() {
        // Form submit: update network
        const calcForm = document.getElementById('calcForm');
        if (calcForm) {
            calcForm.addEventListener('submit', function (e) {
                e.preventDefault();
                updateNetwork();
            });
        }

        // Reset button with confirmation
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                if (confirm('This will reset all subnet divisions you have made. Proceed?')) {
                    startOver();
                }
            });
        }

        // Column toggle checkboxes — single delegated listener
        const columnCheckboxIds = [
            'cb_subnet',
            'cb_netmask',
            'cb_range',
            'cb_useable',
            'cb_hosts',
            'cb_cloudformation',
            'cb_terraform',
            'cb_comments',
            'cb_divide',
            'cb_join',
        ];
        for (const id of columnCheckboxIds) {
            const cb = document.getElementById(id);
            if (cb) {
                cb.addEventListener('change', function () {
                    toggleColumn(this);
                });
            }
        }

        // IaC type change
        const iacTypeSelect = document.getElementById('iacType');
        if (iacTypeSelect) {
            iacTypeSelect.addEventListener('change', handleIacTypeChange);
        }

        // Cloud provider change
        const cloudProviderSelect = document.getElementById('cloudProvider');
        if (cloudProviderSelect) {
            cloudProviderSelect.addEventListener('change', createBookmarkHyperlink);
        }

        // Output format change
        const outputFormatSelect = document.getElementById('outputFormat');
        if (outputFormatSelect) {
            outputFormatSelect.addEventListener('change', createBookmarkHyperlink);
        }

        // Hardcode CIDR checkbox
        const hardcodeCidr = document.getElementById('hardcodeCidr');
        if (hardcodeCidr) {
            hardcodeCidr.addEventListener('change', function () {
                generateIac();
                createBookmarkHyperlink();
            });
        }

        // Generate IaC button
        const generateIacBtn = document.getElementById('generateIacBtn');
        if (generateIacBtn) {
            generateIacBtn.addEventListener('click', generateIac);
        }
    }

    // Initialize calculator on window load
    window.addEventListener('DOMContentLoaded', function () {
        registerEventListeners();
        calcOnLoad();
        handleIacTypeChange();
    });

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

        // Update bookmark link when IaC settings change
        createBookmarkHyperlink();
    }

    // Generates IaC output based on selected type and format
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

        for (const addressWithMask of Object.keys(curComments)) {
            const comment = curComments[addressWithMask];
            const [address, mask] = addressWithMask.split('/');
            const subnetAddress = inet_aton(address);
            const subnetMask = parseInt(mask);

            // Generate a valid CloudFormation resource name from the comment
            const resourceName = comment.replace(/[^a-zA-Z0-9]/g, '');

            // Find the AWS subnet index
            const awsSelect = findAwsSubnetIndex(
                address,
                inet_ntoa(curNetwork),
                subnetMask,
                curMask
            );
            const awsCidrBits = 32 - subnetMask;
            const awsCount = 2 ** (subnetMask - curMask);
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
                    AvailabilityZone: 'us-east-1a', // TODO: Change this to your availability zone
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

        for (const addressWithMask of Object.keys(curComments)) {
            const comment = curComments[addressWithMask];
            const [address, mask] = addressWithMask.split('/');
            const subnetAddress = inet_aton(address);
            const subnetMask = parseInt(mask);

            // Generate a valid Terraform resource name from the comment
            // Terraform identifiers must match [a-zA-Z_][a-zA-Z0-9_]*
            const resourceName = comment
                .replace(/[^a-zA-Z0-9_]/g, '')
                .replace(/^([0-9])/, 'subnet_$1');

            const tfIPBlock = inet_ntoa(curNetwork) + '/' + curMask;
            const tfNewBits = subnetMask - curMask;
            const awsSelect = findAwsSubnetIndex(
                address,
                inet_ntoa(curNetwork),
                subnetMask,
                curMask
            );

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
  availability_zone = "us-east-1a" # TODO: Change this to your availability zone

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
  region        = "us-central1" # TODO: Change this to your region
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
                for (const [key, value] of Object.entries(node)) {
                    yaml += indent(level) + key + ': ';
                    if (typeof value === 'object' && value !== null) {
                        yaml += '\n';
                        processNode(value, level + 1);
                    } else {
                        yaml += value + '\n';
                    }
                }
            } else {
                yaml += node + '\n';
            }
        }
        processNode(json, 0);
        return yaml;
    }

    function toggleColumn(cb, skipRedraw) {
        const cssName = '--display-' + cb.id.substring(3);
        document.documentElement.style.setProperty(cssName, cb.checked ? 'table-cell' : 'none');
        if (!skipRedraw) {
            recreateTables();
            // Update bookmark link when column visibility changes
            createBookmarkHyperlink();
        }
    }

    // Finds the index of a subnet within a supernet using direct arithmetic.
    // Returns the index (>= 0) or -1 if not found.
    function findAwsSubnetIndex(subnetAddress, supernetAddress, subnetMask, supernetMask) {
        const subnetInt =
            typeof subnetAddress === 'string' ? inet_aton(subnetAddress) : subnetAddress;
        const supernetInt =
            typeof supernetAddress === 'string' ? inet_aton(supernetAddress) : supernetAddress;
        const subnetSize = subnet_addresses(subnetMask);
        // Use unsigned right shift (>>> 0) to handle signed 32-bit integer edge cases
        const offset = ((subnetInt >>> 0) - (supernetInt >>> 0)) >>> 0;
        const index = offset / subnetSize;
        if (index >= 0 && Number.isInteger(index)) {
            return index;
        }
        console.warn(
            `Subnet ${typeof subnetAddress === 'string' ? subnetAddress : inet_ntoa(subnetAddress)}/${subnetMask} not found within ${typeof supernetAddress === 'string' ? supernetAddress : inet_ntoa(supernetAddress)}/${supernetMask}`
        );
        return -1;
    }

    // Enhanced URL parameter support - State capture and restoration functions

    /**
     * Gets the current visibility state of all columns
     * @returns {Object} Object with column names and their visibility states
     */
    function getVisibleColumns() {
        const columns = [
            'subnet',
            'netmask',
            'range',
            'useable',
            'hosts',
            'cloudformation',
            'terraform',
            'comments',
            'divide',
            'join',
        ];
        const visibility = {};

        columns.forEach((column) => {
            const checkbox = document.getElementById('cb_' + column);
            if (checkbox) {
                visibility[column] = checkbox.checked;
            }
        });

        return visibility;
    }

    /**
     * Gets the current IaC settings
     * @returns {Object} Object with IaC configuration
     */
    function getIacSettings() {
        const settings = {};

        const iacTypeSelect = document.getElementById('iacType');
        const outputFormatSelect = document.getElementById('outputFormat');
        const cloudProviderSelect = document.getElementById('cloudProvider');
        const hardcodeCidrCheckbox = document.getElementById('hardcodeCidr');

        if (iacTypeSelect) settings.iacType = iacTypeSelect.value;
        if (outputFormatSelect) settings.outputFormat = outputFormatSelect.value;
        if (cloudProviderSelect) settings.cloudProvider = cloudProviderSelect.value;
        if (hardcodeCidrCheckbox) settings.hardcodeCidr = hardcodeCidrCheckbox.checked;

        return settings;
    }

    /**
     * Restores column visibility from settings object
     * @param {Object} columnSettings - Object with column visibility states
     */
    function restoreColumnVisibility(columnSettings) {
        if (!columnSettings || typeof columnSettings !== 'object') return;

        // Update checkboxes and CSS properties without multiple table recreations
        Object.entries(columnSettings).forEach(([column, isVisible]) => {
            const checkbox = document.getElementById('cb_' + column);
            if (checkbox && typeof isVisible === 'boolean') {
                checkbox.checked = isVisible;
                // Update CSS property directly for performance
                const cssName = '--display-' + column;
                document.documentElement.style.setProperty(
                    cssName,
                    isVisible ? 'table-cell' : 'none'
                );
            }
        });

        // Single table recreation at the end for performance
        // Note: recreateTables() will be called later in the initialization process
    }

    /**
     * Restores IaC settings from settings object
     * @param {Object} iacSettings - Object with IaC configuration
     */
    function restoreIacSettings(iacSettings) {
        if (!iacSettings || typeof iacSettings !== 'object') return;

        const iacTypeSelect = document.getElementById('iacType');
        const outputFormatSelect = document.getElementById('outputFormat');
        const cloudProviderSelect = document.getElementById('cloudProvider');
        const hardcodeCidrCheckbox = document.getElementById('hardcodeCidr');

        if (iacSettings.iacType && iacTypeSelect) {
            iacTypeSelect.value = iacSettings.iacType;
        }

        if (iacSettings.outputFormat && outputFormatSelect) {
            outputFormatSelect.value = iacSettings.outputFormat;
        }

        if (iacSettings.cloudProvider && cloudProviderSelect) {
            cloudProviderSelect.value = iacSettings.cloudProvider;
        }

        if (typeof iacSettings.hardcodeCidr === 'boolean' && hardcodeCidrCheckbox) {
            hardcodeCidrCheckbox.checked = iacSettings.hardcodeCidr;
        }

        // Trigger IaC type change to update UI
        if (iacTypeSelect) {
            handleIacTypeChange();
        }
    }

    /**
     * Creates a user-friendly URL description
     * @returns {string} Human-readable description of the current state
     */
    function createFriendlyUrl() {
        const networkStr = inet_ntoa(curNetwork);
        const maskStr = curMask.toString();
        const commentCount = Object.keys(curComments).length;
        const visibleColumns = getVisibleColumns();
        const visibleCount = Object.values(visibleColumns).filter((v) => v).length;

        let description = `${networkStr}/${maskStr}`;

        if (commentCount > 0) {
            description += ` (${commentCount} subnet${commentCount > 1 ? 's' : ''} commented)`;
        }

        if (visibleCount < 10) {
            // Not all columns visible
            description += ` - ${visibleCount} columns shown`;
        }

        return description;
    }
})();
