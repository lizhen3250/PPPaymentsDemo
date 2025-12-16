// 生成计数器
//let payloadCount = 1;
let currentJson = null;
let currentGoodsType = "physical"; // 当前商品类型：physical 或 virtual

// DOM元素
const physicalBtn = document.getElementById('physicalBtn');
const virtualBtn = document.getElementById('virtualBtn');
const jsonOutput = document.getElementById('jsonOutput');
const copyBtn = document.getElementById('copyBtn');
const refreshBtn = document.getElementById('refreshBtn');
const clearBtn = document.getElementById('clearBtn');
const countElement = document.getElementById('count');
const currentTypeElement = document.getElementById('currentType');
const typeIndicatorElement = document.getElementById('typeIndicator');
const notification = document.getElementById('notification');

//payment oiptions
const paymentOptions = document.querySelectorAll('.payment-option');
const actionSection = document.querySelector('.action-section');
const actionButton = document.querySelector('.action-button');
const actionTitle = document.querySelector('.action-section h3');
const instructions = document.querySelector('.instructions');

// 物理商品数据模板
const physicalGoodsTemplates = [
    {
        intent: "CAPTURE",
        payment_source: {
            paypal: {
                experience_context: {
                    return_url: "https://www.example.com/return_url",
                    cancel_url: "https://www.example.com/cancel_url",
                    brand_name: "Jin China Store",
                    user_action: "PAY_NOW",
                    shipping_preference: "SET_PROVIDED_ADDRESS",
                    payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED"
                }
            }
        },
        payer: {
            email_address: 'abccredit@gmail.com',
            name: {
                given_name: 'Jin',
                surname: 'Li'
            },
            phone: {
                phone_number: {
                    national_number: '5555555555'
                }
            },
            address: {
                address_line_1: 'philidelphia ave',
                address_line_2: '11',
                admin_area_1: 'Los Angeles',
                admin_area_2: 'CA',
                postal_code: '90001',
                country_code: 'US'
            }
        },
        purchase_units: [
            {
                //invoice_id: Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1),
                amount: {
                    currency_code: "USD",
                    value: "230.00",
                    breakdown: {
                        item_total: {
                            currency_code: "USD",
                            value: "220.00"
                        },
                        shipping: {
                            currency_code: "USD",
                            value: "10.00"
                        }
                    }
                },
                items: [
                    {
                        name: "T-Shirt",
                        description: "Super Fresh Shirt",
                        unit_amount: {
                            currency_code: "USD",
                            value: "20.00"
                        },
                        quantity: "1",
                        category: "PHYSICAL_GOODS"
                    },
                    {
                        name: "Shoes",
                        description: "Running, Size 10.5",
                        unit_amount: {
                            currency_code: "USD",
                            value: "100.00"
                        },
                        quantity: "2",
                        category: "PHYSICAL_GOODS"
                    }
                ],
                shipping: {
                    type: "SHIPPING",
                    name: {
                        full_name: "Zhen Li"
                    },
                    phone_number: {
                        country_code: "010",
                        national_number: "4104567890"
                    },
                    email_address: "test@test.com",
                    address: {
                        address_line_1: "11 philidelphia ave",
                        admin_area_1: "CA",
                        admin_area_2: "Los Angeles",
                        postal_code: "90001",
                        country_code: "US"
                    }
                }
            }
        ]
    }
];

// 虚拟商品数据模板
const virtualGoodsTemplates = [
    {
        intent: "CAPTURE",
        payment_source: {
            paypal: {
                experience_context: {
                    return_url: "https://www.example.com/return_url",
                    cancel_url: "https://www.example.com/cancel_url",
                    brand_name: "Jin China Store",
                    user_action: "PAY_NOW",
                    shipping_preference: "NO_SHIPPING",
                    payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED"
                }
            }
        },
        purchase_units: [
            {
                //invoice_id: Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1),
                amount: {
                    currency_code: "USD",
                    value: "220.00",
                    breakdown: {
                        item_total: {
                            currency_code: "USD",
                            value: "220.00"
                        }
                    }
                },
                items: [
                    {
                        name: "VIP game coin",
                        description: "Super Fresh Shirt",
                        unit_amount: {
                            currency_code: "USD",
                            value: "20.00"
                        },
                        quantity: "1",
                        category: "DIGITAL_GOODS"
                    },
                    {
                        name: "Gold game coin",
                        description: "Running, Size 10.5",
                        unit_amount: {
                            currency_code: "USD",
                            value: "100.00"
                        },
                        quantity: "2",
                        category: "DIGITAL_GOODS"
                    }
                ]
            }
        ]
    }
];

// 随机选择模板
function getRandomTemplate(type) {
    if (type === "physical") {
        const randomIndex = Math.floor(Math.random() * physicalGoodsTemplates.length);
        return physicalGoodsTemplates[randomIndex];
    } else {
        const randomIndex = Math.floor(Math.random() * virtualGoodsTemplates.length);
        return virtualGoodsTemplates[randomIndex];
    }
}

// 更新UI显示当前选择的商品类型
function updateGoodsType(type) {
    currentGoodsType = type;
    // 更新按钮激活状态
    if (type === "physical") {
        physicalBtn.classList.add("active");
        virtualBtn.classList.remove("active");
        currentTypeElement.textContent = "Physical Goods";
        currentTypeElement.className = "selection-type physical-type";
        typeIndicatorElement.textContent = "Physical Goods";
        typeIndicatorElement.className = "type-indicator physical-indicator";
    } else {
        physicalBtn.classList.remove("active");
        virtualBtn.classList.add("active");
        currentTypeElement.textContent = "Virtual Goods";
        currentTypeElement.className = "selection-type virtual-type";
        typeIndicatorElement.textContent = "Virtual Goods";
        typeIndicatorElement.className = "type-indicator virtual-indicator";
    }
}

// 语法高亮JSON
function syntaxHighlight(json) {
    if (typeof json != 'string') {
        json = JSON.stringify(json, null, 2);
    }

    // 转义HTML特殊字符
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // 添加语法高亮
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls = 'json-number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'json-key';
            } else {
                cls = 'json-string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'json-boolean';
        } else if (/null/.test(match)) {
            cls = 'json-null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

// 生成JSON payload
function generatePayload(type = null) {
    const goodsType = type || currentGoodsType;
    const template = getRandomTemplate(goodsType);
    const timestamp = new Date().toISOString();

    // 添加元数据
    const payload = {
        ...template,
        // metadata: {
        //     generatedAt: timestamp,
        //     requestId: `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        //     apiVersion: "1.2.0",
        //     endpoint: `/api/products/${goodsType}`
        // }
    };

    currentJson = payload;
    //payloadCount++;
    //countElement.textContent = payloadCount;

    // 显示JSON并应用语法高亮
    jsonOutput.innerHTML = syntaxHighlight(payload);

    return payload;
}

// 显示通知
function showNotification(message) {
    notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// 复制JSON到剪贴板
function copyToClipboard() {
    if (!currentJson) {
        showNotification("Please create a JSON payload");
        return;
    }

    const jsonString = JSON.stringify(currentJson, null, 2);
    navigator.clipboard.writeText(jsonString)
        .then(() => {
            showNotification("JSON has been copied to the clipboard!");
        })
        .catch(err => {
            console.error('Copy failed: ', err);
            showNotification("Copy failed, please manually copy");
        });
}

// 清除JSON显示
function clearJson() {
    jsonOutput.innerHTML = '<span style="color: #95a5a6;">// Select the product type and click the button to generate a JSON payload</span>';
    currentJson = null;
    showNotification("Cleared");
}

// 事件监听
physicalBtn.addEventListener('click', () => {
    updateGoodsType("physical");
    generatePayload("physical");
});

virtualBtn.addEventListener('click', () => {
    updateGoodsType("virtual");
    generatePayload("virtual");
});

copyBtn.addEventListener('click', copyToClipboard);
refreshBtn.addEventListener('click', () => generatePayload());
clearBtn.addEventListener('click', clearJson);

// 初始生成一个payload
updateGoodsType("physical");
generatePayload("physical");

//payment option 
// 支付方式对应的配置
const paymentConfigs = {
    'paypal': {
        title: 'Pay with PayPal',
        fundingSource: 'paypal',
        buttonId: 'paypal-button-container'
    },
    'paylater': {
        title: 'PayPal Pay Later',
        fundingSource: 'paylater',
        buttonId: 'paypal-paylater-button-container'

    },
    'credit': {
        title: 'Credit and Debit Card',
        fundingSource: 'credit',
        buttonId: 'paypal-button-container'

    }
};

// 添加点击事件监听器
paymentOptions.forEach(option => {
    option.addEventListener('click', function () {
        // 移除所有选项的选中状态
        paymentOptions.forEach(opt => {
            opt.classList.remove('selected');
        });

        // 添加当前选项的选中状态
        this.classList.add('selected');

        // 获取选择的支付方式
        const paymentMethod = this.getAttribute('data-payment');

        // 隐藏操作区域并应用新的配置
        actionSection.classList.remove('visible');

        // 短暂延迟后更新并显示操作区域
        setTimeout(() => {
            const config = paymentConfigs[paymentMethod];
            console.log(config);
            //console.log(actionButton);
            //actionButton.id = config.buttonId;
            if (config.fundingSource == 'paylater') {
                console.log("paylater");
                document.getElementById('paypal-button-container').style.display = 'none';
                document.getElementById('paypal-paylater-button-container').style.display = '';
                document.getElementById('paypal-basic-card-button').style.display = 'none';
            }

            if (config.fundingSource == 'paypal') {
                document.getElementById('paypal-button-container').style.display = '';
                document.getElementById('paypal-paylater-button-container').style.display = 'none';
                document.getElementById('paypal-basic-card-button').style.display = 'none';
            }


            if (config.fundingSource == 'credit') {
                console.log("credit");
                document.getElementById('paypal-button-container').style.display = 'none';
                document.getElementById('paypal-paylater-button-container').style.display = 'none';
                document.getElementById('paypal-basic-card-button').style.display = '';
            }



            // 更新操作区域内容
            actionTitle.textContent = config.title;
            //actionButton.innerHTML = config.icon + ' ' + config.buttonText;
            //instructions.textContent = config.instructions;

            // 更新按钮样式类
            //actionButton.className = 'action-button ' + config.buttonClass;

            // 显示操作区域
            actionSection.classList.add('visible');
        }, 300);
    });
});

// 添加键盘导航支持
document.addEventListener('keydown', function (event) {
    const selected = document.querySelector('.payment-option.selected');
    let index = Array.from(paymentOptions).indexOf(selected);

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        index = (index + 1) % paymentOptions.length;
        paymentOptions[index].click();
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        index = (index - 1 + paymentOptions.length) % paymentOptions.length;
        paymentOptions[index].click();
    } else if (event.key === 'Enter' && document.activeElement === selected) {
        actionButton.click();
    }
});

// 为支付选项添加焦点支持
paymentOptions.forEach(option => {
    option.setAttribute('tabindex', '0');
});