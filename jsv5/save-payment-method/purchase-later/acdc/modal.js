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
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const loadingDots = document.getElementById('loadingDots');

//payment oiptions
const paymentOptions = document.querySelectorAll('.payment-option');
const actionSection = document.querySelector('.action-section');
const actionButton = document.querySelector('.action-button');
const actionTitle = document.querySelector('.action-section h3');
const instructions = document.querySelector('.instructions');

//select
const selectThreedSElement = document.getElementById("threeds");
const selectedValue = selectThreedSElement.value;

selectThreedSElement.addEventListener('change', function () {
    selectThreedSElement.value = this.value;
    if (currentGoodsType == 'physical') {
        console.log(this.value);
        physicalGoodsTemplates[0].payment_source.card.verification_method = this.value;
    } else if (currentGoodsType == 'virtual') {
        console.log(this.value);
    }
    updateGoodsType(currentGoodsType);
    generatePayload(currentGoodsType);
})



// 物理商品数据模板
const physicalGoodsTemplates = [
    {
        customer: {
            id: "customer_id",
            merchant_customer_id: "merchant_customer_id"
        },
        payment_source: {
            card: {
                experience_context: {
                    return_url: window.location.href,
                    cancel_url: window.location.href + "cancel_url"
                }
            }
        }
    }
];

// 虚拟商品数据模板
const virtualGoodsTemplates = [
    {
        customer: {
            id: "customer_id",
            merchant_customer_id: "merchant_customer_id"
        },
        payment_source: {
            card: {
                experience_context: {
                    return_url: window.location.href,
                    cancel_url: window.location.href + "cancel_url"
                }
            }
        }
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
    console.log(selectThreedSElement.value);
    // 更新按钮激活状态
    if (type === "physical") {
        physicalBtn.classList.add("active");
        virtualBtn.classList.remove("active");
        currentTypeElement.textContent = "Physical Goods";
        currentTypeElement.className = "selection-type physical-type";
        typeIndicatorElement.textContent = "Physical Goods";
        typeIndicatorElement.className = "type-indicator physical-indicator";
        physicalGoodsTemplates[0].payment_source.card.verification_method = selectThreedSElement.value;
        selectThreedSElement.addEventListener('change', function () {
            physicalGoodsTemplates[0].payment_source.card.verification_method = selectThreedSElement.value;
        })
    } else {
        physicalBtn.classList.remove("active");
        virtualBtn.classList.add("active");
        currentTypeElement.textContent = "Virtual Goods";
        currentTypeElement.className = "selection-type virtual-type";
        typeIndicatorElement.textContent = "Virtual Goods";
        typeIndicatorElement.className = "type-indicator virtual-indicator";
        virtualGoodsTemplates[0].payment_source.card.verification_method = selectThreedSElement.value;
        selectThreedSElement.addEventListener('change', function () {
            virtualGoodsTemplates[0].payment_source.card.verification_method = selectThreedSElement.value;
        })
    }
    generatePayload(currentGoodsType);
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



// 信用卡数据
const cardsData = [
    {
        id: 1,
        cardNumber: "4868 7191 9682 9038",
        cardType: "visa",
        expiryDate: "01/27",
        cvv: "123",
        icon: "fa-brands fa-cc-visa"
    },
    {
        id: 2,
        cardNumber: "5329 8797 0782 4603",
        cardType: "mastercard",
        expiryDate: "01/27",
        cvv: "123",
        icon: "fa-brands fa-cc-mastercard"
    }
];

// 获取DOM元素
const cardsContainer = document.getElementById('cardsContainer');
const cardTypeSelect = document.getElementById('cardType');


// 初始化信用卡列表
function renderCards() {
    cardsContainer.innerHTML = '';

    cardsData.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card-item';
        cardElement.dataset.id = card.id;

        // 根据卡片类型设置不同的渐变色
        let gradient = '';
        switch (card.cardType) {
            case 'visa': gradient = 'linear-gradient(135deg, #1a1f71, #1a1f71)'; break;
            case 'mastercard': gradient = 'linear-gradient(135deg, #eb001b, #f79e1b)'; break;
            case 'amex': gradient = 'linear-gradient(135deg, #2c77ba, #6ac4e9)'; break;
            case 'discover': gradient = 'linear-gradient(135deg, #ff6000, #ff9e00)'; break;
            default: gradient = 'linear-gradient(135deg, #4a6fa5, #2c3e50)';
        }

        cardElement.style.background = gradient;

        // 获取卡片类型名称
        const cardTypeName = getCardTypeName(card.cardType);

        cardElement.innerHTML = `
                    <div class="card-header">
                        <div class="card-type">${cardTypeName}</div>
                        <div class="card-icon"><i class="${card.icon}"></i></div>
                    </div>
                    <div class="card-number">${card.cardNumber}</div>
                    <div class="card-details">
                        <div>
                            <div class="card-detail-label">Expiry</div>
                            <div class="card-detail-value">${card.expiryDate}</div>
                        </div>
                        <div>
                            <div class="card-detail-label">CVV</div>
                            <div class="card-detail-value">${card.cvv}</div>
                        </div>
                    </div>
                `;

        cardsContainer.appendChild(cardElement);
    });
}
// 获取卡片类型名称
function getCardTypeName(type) {
    switch (type) {
        case 'visa': return 'Visa';
        case 'mastercard': return 'MasterCard';
        case 'amex': return 'American Express';
        case 'discover': return 'Discover';
        default: return '信用卡';
    }
}

// 初始化页面
document.addEventListener('DOMContentLoaded', function () {
    renderCards();
});