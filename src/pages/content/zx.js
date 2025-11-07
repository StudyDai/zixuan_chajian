console.log('成功植入浏览器,现在window已经是同一个,可以进行修改,要在manifest里面配置静态资源路径', chrome)
// 保存原始的 XMLHttpRequest 构造函数
const OriginalXMLHttpRequest = window.XMLHttpRequest;
let list = []
let timer = null
let startSave = false
let saveList = []
let my_xhr = null, isCollect = false, collectData = false
let xlsxData = []
let isWork = false
const flag = localStorage.getItem('start_look') ? JSON.parse(localStorage.getItem('start_look')) : false
const requestMap = {

}
let listMap = {}
console.log(window.rawData, '看看')
let reg = /https:\/\/www\.temu\.com/
if (reg.test(location.href)) {
// 如果是进入详情页 就会有这个玩意
let btn = document.createElement('button')
btn.style.position = 'fixed'
btn.style.top = '100px'
btn.style.right = '50px'
btn.style.zIndex = '9999'
btn.innerText = '点击记录一次'
// 下载的按钮
let downloadBtn = document.createElement('button')
downloadBtn.style.position = 'fixed'
downloadBtn.style.top = '150px'
downloadBtn.style.right = '50px'
downloadBtn.style.zIndex = '9999'
downloadBtn.innerText = '下载记录数据'
btn.onclick = function() {
    if (window.rawData) {
        // 发给background
        chrome.runtime.sendMessage('nniceknhnmnjjhakclikapdojinhiblb', {
            message: 'saveCurrentSkuPrice',
            skuList: window.rawData.store.sku,
            goodId: window.rawData.store.goodsId
        })
    }
}
downloadBtn.onclick = function() {
    chrome.runtime.sendMessage('nniceknhnmnjjhakclikapdojinhiblb', {
        message: 'downloadTEMUDetailData'
    })
}
document.body.appendChild(btn)
document.body.appendChild(downloadBtn)
}


if (flag) {
    // 在这个地方请求会咋样
    fetch('https://api-eu.dhl.com/track/shipments?trackingNumber=CH100315047DE',{
        method: 'get',
        headers: {
            'DHL-API-Key': 'Rxt8wcpVhfCrmQSAcMV6opzkydei7eev'
        }
    })
    console.log(flag)
    // 重写 XMLHttpRequest 构造函数
    window.XMLHttpRequest = function () {
        const temureg = /https:\/\/www\.temu\.com\/search_result\.html/
        if (temureg.test(location.href)) {
            // 插入一个可以导出数据的玩意
            // 这个地方插入一个按钮
            const divEl = document.createElement('div')
            divEl.style.position = 'fixed'
            divEl.style.top = '250px'
            divEl.style.right = '80px'
            divEl.innerText = '点击开始监听'
            divEl.style.cursor = 'pointer'
            divEl.onclick = function() {
                console.log('我启动了')
                collectData = true
                // 看看里面存了什么
                console.log(requestMap.list_el)
                if (requestMap.list_el) {
                    // 发给background
                    chrome.runtime.sendMessage('nniceknhnmnjjhakclikapdojinhiblb', {
                        message: 'sendWordList',
                        wordList: requestMap.list_el.responseText
                    })
                }
            }
            document.body.appendChild(divEl)
        }
        const xhr = new OriginalXMLHttpRequest();
        my_xhr = xhr
        let requestBody;
        // 重写 send 方法，获取请求体
        const originalSend = xhr.send;
        const originalOpen = xhr.open
        let haveSave = false
        let temuSave = false
        xhr.open = function(...data) {
            // 拿到地址
            requestUrl = data
            // 如果是我要的分仓地址,那么就保存数据到本地
            // 看看我的temu的"/api/poppy/v1/search?scene=search"
            // https://seller-acs.aliexpress.com/h5/mtop.asf.local.supply.fulfillment.shipping.fulfill.record.get/1.0/
            let reg = /seller-acs\.aliexpress\.com\/h5\/mtop\.asf\.local\.supply\.fulfillment\.shipping\.fulfill\.record\.get\/1\.0\//
            let reg2 = /api\/shipout-shipment\/shipment\/getShipmentByOrderId/
            let reg3 = /api\/poppy\/v1\/search\?scene=search/
            let reg4 = /https:\/\/tools\.usps\.com\/go\/TrackConfirmAction/
            let reg5 = /seller-acs\.aliexpress\.com\/h5\/mtop\.asf\.local\.supply\.fulfillment\.shipping\.package\.record\.get\/1\.0/
            console.log(requestUrl,'这些都是地址')
            // temu的拿产品路径
            // let temuReg = /https:\/\/www\.temu\.com\/api\/poppy\/v1\/search\?scene=search/
            if (reg.test(requestUrl[1])) {
                console.log('Request Url', requestUrl)
            } else if (reg2.test(requestUrl[1])) {
                // 那么就设置我要保存
                haveSave = true
            } else if (reg3.test(requestUrl[1])) {
                requestMap.list_el = xhr
            } else if (reg4.test(requestUrl[1])) {
                // console.log('嘿嘿,我有东西', requestUrl)
            } else if (reg5.test(requestUrl[1])) {
                if (startSave) {
                    console.log('把这个数据存起来')
                    let uuid = new Date().getTime()
                    listMap[uuid] = xhr
                }
            }
            originalOpen.call(this, ...data)
        }
        xhr.send = function (...data) {
            requestBody = data;
            console.log('我是发送请求', data)
            if (isCollect) {
                isCollect = false
                console.log('Request Body:', requestBody);
            } else if (haveSave) {
                haveSave = false
                localStorage.setItem('shipout_params', requestBody)
            } else if (temuSave) {
                // 包是的,所以锁掉
                temuSave = false
                console.log('按道理应该是优的啊', requestBody)
            }
            originalSend.call(this, ...data);
        };
        return xhr;
    }
    const reg = /https:\/\/csp\.aliexpress\.com\/m_apps\/logistics/
    console.log(reg.test(location.href))
    if (reg.test(location.href)) {
        // 进来就直接给按钮添加点击事件
        let work = document.querySelector('.getNetwork')
        // 这个是下载维赢的
        let down = document.querySelector('.downloadWork')
        // 这个是下载派派的 
        let downPaiPai = document.querySelector('.downloadWorkByOms')
        // 这个是下载发货的
        let send = document.querySelector('.downloadAliexpressByOrder')
        // 下载发货的
        let down_send = document.querySelector('.downloadAliexpressByOrder2')
        if (work) {
            down.onclick = function() {
                if (list.length) {
                    // 证明有单子 那么就开始循环
                    for (let index = 0; index < list.length; index++) {
                        // 数量
                            let item = list[index]
                            let num = item.partialPackagedRate.split('/')[1]
                            let code = item.receiverZip[0]
                            // 美东
                            if (code < 7) {
                                // 美东 0-6
                                xlsxData = xlsxData.concat([[item.tradeOrderId, item.fulfillmentOrderItemList[0].itemCode, num, '','',item.receiverName, '', item.receiverAddressDetail, '', item.receiverProvince, item.receiverCity, item.receiverZip, item.receiverCountry, item.receiverMobile, '', 'Service with Lowest Estimate Rate', 'USPS', 'No Sign Required/ Service Default', '美东']])
                            } else {
                                // 美西 7-9
                                xlsxData = xlsxData.concat([[item.tradeOrderId, item.fulfillmentOrderItemList[0].itemCode, num, '','',item.receiverName, '', item.receiverAddressDetail, '', item.receiverProvince, item.receiverCity, item.receiverZip, item.receiverCountry, item.receiverMobile, '', 'Service with Lowest Estimate Rate', 'USPS', 'No Sign Required/ Service Default', '美西']])
                            }
                    }
                }
            }
            work.onclick = function() {
                isWork = !isWork
                // 再点一次的时候导出
                if (!isWork) {
                    // 这个是维赢的
                    localStorage.setItem('cacheAliexpress',JSON.stringify(xlsxData))
                    // 这个是paipai的
                    localStorage.setItem('cacheAliexpressByOms',JSON.stringify(xlsxData))
                }
                console.log('我来了', my_xhr)
                // 这个地方点击才开始去收集
                isCollect = true
                timer && clearInterval(timer)
                if (!isWork) {
                    clearInterval(timer)
                    return
                }
                timer = setInterval(() => {
                    if (my_xhr.responseText) {
                        let data = JSON.parse(my_xhr.responseText)
                        if (data) {
                            if (data.v === '1.0') {
                                console.log(data) 
                                // 这个就是我要的数据
                                list = list.concat(...data.data.data.dataSource)
                                clearInterval(timer)
                            } else {
                                console.log('other', data)
                            }
                        }
                    }
                }, 2000);
            }
            downPaiPai.onclick = function() {
                console.log('这就是我抓到的数据', xlsxData)
                if (list.length) {
                    // 证明有单子 那么就开始循环
                    for (let index = 0; index < list.length; index++) {
                        // 数量
                            let item = list[index]
                            let num = item.partialPackagedRate.split('/')[1]
                            let code = item.receiverZip[0]
                            // 这个地方去调用邮编帮我算吧 哎~
                            xlsxData = xlsxData.concat([[item.tradeOrderId, '', 'aliExpress','仓库名称', '发货仓库面单', 'USPS-广州手指头','', item.fulfillmentOrderItemList[0].itemCode,'100',item.fulfillmentOrderItemList[0].quantity,'100','CNY','',item.receiverName,item.receiverMobile,'', item.receiverZip, item.receiverCountry, item.receiverProvince,item.receiverCity,'',item.receiverAddressDetail]])
                    }
                }
            }
            send.onclick = function() {
                // 第一次点击的时候会激活
                if (!startSave) {
                    startSave = true
                }
                // 这个地方直接就是看下存了啥先
                let key = Object.keys(listMap)
                let val = listMap[key[0]]
                // 格式化掉
                let resp = JSON.parse(val.responseText)
                let value = resp.data.data.dataSource
                for (let index = 0; index < value.length; index++) {
                    const element = value[index];
                    let sendDate = new Date(element.tradeCreateTime)
                    let createDate = new Date(element.packageCreateTime)
                    let format_sendDate = `${sendDate.getFullYear()}年${sendDate.getMonth() + 1}月${sendDate.getDate()}日`
                    let format_createDate = `${createDate.getFullYear()}年${createDate.getMonth() + 1}月${createDate.getDate()}日`
                    saveList.unshift([element.tradeOrderId, format_sendDate,format_createDate, element.packageItemVOList[0].itemCode, element.serviceCode, element.trackingNumber,element.packageStatusDesc,element.receiverName, element.receiverCountry, element.receiverProvince, element.receiverCity, element.receiverAddressDetail, element.receiverZip, element.receiverMobile])
                }
                console.log('当前数据', saveList)
                // 这个地方要把对象清空
                listMap = {}
            }
            down_send.onclick = function() {
                saveList.unshift(['订单号', '包裹下单时间','包裹发货时间', '产品SKU','物流','运单号','订单状态','用户名','目标国家','目标州/省','目标城市','目标地址1','目标邮编','买家电话'])
                localStorage.setItem('cacheAliExpressSendOrder', JSON.stringify(saveList))
            }
        } 
    }
}


