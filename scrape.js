const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const apiData = {};

function doUrl(url) {
    axios(url)
        .then(response => {
            const html = response.data;
            const $ = cheerio.load(html);
            let obj = {
                properties: {},
                methods: {},
                events: {},
                service: false,
                browsable: true,
                creatable: true
            };

            let name = $('.top-heading-wrap.deprecated-wrapper > h1').text().trim();
            obj.name = name;

            /* Parse Properties */
            let props = $('#properties > .table.tbl-items');
            let inheritedProps = $('#properties > .inherited-wrap > .inherited-tbls > .table.tbl-items');

            props.each(function() {
                let prop = {replicated: true, deprecated: false, readonly: false};
                let classType = $(this).find('td > span.code-wrap > code.type > a.type-link').text().trim();
                let name = $(this).find('td > span.code-wrap > code.name > h3 > a').text().trim();
                $(this).find('.api-tag').each(function() {
                    let t = $(this).text();
                    if (t == '[Deprecated]')
                        prop.deprecated = true;
                    else if (t == '[NotReplicated]')
                        prop.replicated = false;
                    else if (t == '[ReadOnly]')
                        prop.readonly = true;
                });

                if (classType == 'int' || classType == 'float')
                    classType = 'number'

                prop.type = classType;
                obj.properties[name] = prop;
            });

            inheritedProps.each(function() {
                let prop = {replicated: true, deprecated: false, readonly: false};
                let classType = $(this).find('td > span.code-wrap > code.type > a.type-link').text().trim();
                let name = $(this).find('td > code.name > h3').text().trim();
                $(this).find('.api-tag').each(function() {
                    let t = $(this).text().toLowerCase();
                    if (t == '[deprecated]')
                        prop.deprecated = true;
                    else if (t == '[notreplicated]')
                        prop.replicated = false;
                    else if (t == '[readonly]')
                        prop.readonly = true;
                });

                if (classType == 'Dictionary')
                    classType = 'table';
                if (classType == 'int' || classType == 'float')
                    classType = 'number'

                prop.type = classType;
                obj.properties[name] = prop;
            });

            let methods = $('#functions > .table.tbl-items');
            let inheritedMethods = $('#functions > .inherited-wrap > .inherited-tbls > .table.tbl-items');
            methods.each(function() {
                let method = {arguments: [], returns: null, deprecated: false, replicated: true, yields: false};
                let classType = $(this).find('span.code-wrap > code.type > a').text().trim();
                let name = $(this).find('td > span.code-wrap > code.name > h3 > a').text().trim();

                $(this).find('.api-tag').each(function() {
                    let t = $(this).text().toLowerCase();
                    if (t == '[deprecated]')
                        method.deprecated = true;
                    else if (t == '[notreplicated]')
                        method.replicated = false;
                });

                $(this).find('.argument > span.type > code.type > a').each(function() {
                    let arg = $(this).text().trim();
                    if (arg == 'Dictionary')
                        arg = 'table';
                    else if (arg == 'int' || arg == 'float')
                        arg = 'number';
                    method.arguments.push(arg)
                });

                if (classType == 'Dictionary')
                    classType = 'table';
                else if (classType == 'int' || classType == 'float')
                    classType = 'number';

                method.returns = classType;
                obj.methods[name] = method;
            });

            inheritedMethods.each(function() {
                let method = {arguments: [], returns: null, deprecated: false, replicated: true, yields: false};
                let classType = $(this).find('td > span.code-wrap > code.type > a.type-link').text().trim();
                let name = $(this).find('code.name > h3 > a').text().trim();

                $(this).find('.api-tag').each(function() {
                    let t = $(this).text().toLowerCase();
                    if (t == '[deprecated]')
                        method.deprecated = true;
                    else if (t == '[notreplicated]')
                        method.replicated = false;
                });

                $(this).find('.argument > span.type > code.type > a').each(function() {
                    let arg = $(this).text().trim();
                    if (arg == 'Dictionary')
                        arg = 'table';
                    else if (arg == 'int' || arg == 'float')
                        arg = 'number';
                    method.arguments.push(arg)
                });

                if (classType == 'Dictionary')
                    classType = 'table';
                else if (classType == 'int' || classType == 'float')
                    classType = 'number';

                method.returns = classType;
                
                obj.methods[name] = method;
            });

            let events = $('#events > .table.tbl-items');
            let inheritedEvents = $('#events > .inherited-wrap > .inherited-tbls > .table.tbl-items');
            events.each(function() {
                let event = {arguments: [], deprecated: false, replicated: true};
                let name = $(this).find('td > span.code-wrap > code.name > h3 > a').text().trim();

                $(this).find('.api-tag').each(function() {
                    let t = $(this).text().toLowerCase();
                    if (t == '[deprecated]')
                        event.deprecated = true;
                    else if (t == '[notreplicated]')
                        event.replicated = false;
                });

                $(this).find('.argument > span.type > code.type > a').each(function() {
                    let arg = $(this).text().trim();
                    if (arg == 'Dictionary')
                        arg = 'table';
                    else if (arg == 'int' || arg == 'float')
                        arg = 'number';
                    event.arguments.push(arg)
                });
                
                obj.events[name] = event;
            });

            inheritedEvents.each(function() {
                let event = {arguments: [], deprecated: false, replicated: true};
                let name = $(this).find('code.name > h3 > a').text().trim();

                $(this).find('.api-tag').each(function() {
                    let t = $(this).text().toLowerCase();
                    if (t == '[deprecated]')
                        event.deprecated = true;
                    else if (t == '[notreplicated]')
                        event.replicated = false;
                });

                $(this).find('.argument > span.type > code.type > a').each(function() {
                    let arg = $(this).text().trim();
                    if (arg == 'Dictionary')
                        arg = 'table';
                    else if (arg == 'int' || arg == 'float')
                        arg = 'number';
                    event.arguments.push(arg)
                });
                
                obj.events[name] = event;
            });

            let alerts = $('.alert.alert-success > b');
            let alerts2 = $('.alert.alert-secondary > b');
            let alerts3 = $('.alert.alert-info > b');
            alerts.each(function() {
                if ($(this).text().trim().toLowerCase() == 'service')
                    obj.service = true;
            });
            alerts2.each(function() {
                if ($(this).text().trim().toLowerCase() == 'notbrowsable')
                    obj.browsable = false;
            });
            alerts3.each(function() {
                if ($(this).text().trim().toLowerCase() == 'notcreatable')
                    obj.creatable = false;
            });

            fs.writeFileSync(path.join(__dirname, 'src', name + '.json'), JSON.stringify(obj, null, 4));
        })
}

axios('https://developer.roblox.com/en-us/api-reference/class/Instance')
    .then(function(response) {
        const html = response.data;
        const $ = cheerio.load(html);

        let apiItems = $('ul.multi-nested-list');
        $(apiItems).find('a').each(function() {
            console.log('https://developer.roblox.com' + $(this).attr('href'))
            doUrl('https://developer.roblox.com' + $(this).attr('href'));
        })
    })