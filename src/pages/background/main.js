import FFmpeg from "@ffmpeg/ffmpeg";
const { createFFmpeg, fetchFile } = FFmpeg;
const baseURL = 'http://192.168.188.47:8889'
const ffmpeg = createFFmpeg({
    corePath: chrome.runtime.getURL("/js/ffmpeg-core.js"), // 核心文件的路径
    log: true, // 是否在控制台打印日志，true => 打印
})
console.log('background is open')
let currentActiveId = 0
let stockAllInfo = []
let currentCookie = ''
let currentMallId = ''
let PaiPaiWareHouse = []
let haveTime = ''
let currentCode = ''
let goodListCookie = ''
// 发货时的产品的尺寸数据
let sendOrderData = null
// 这个是导出订单的数组
let sendXLSXData = [['订单日期', 'SKU号', 'SKC号', '订单号', '日常价格', '活动价格', '活动名称', '数量']]
let PaiPaiWrehouseId = [
    {
        "id": 1131,
        "name": "派派仓-洛杉矶",
        "relas": "派派美西"
    },
    {
        "id": 1216,
        "name": "派派仓-纽约",
        "relas": "派派美东"
    },
    {
        "id": 1215,
        "name": "派派仓-达拉斯",
        "relas": "派派德州"
    },
    {
        "id": 1214,
        "name": "派派仓-迈阿密",
        "relas": "派派佛州"
    }
]
let accountList = localStorage.getItem('accountList') ? JSON.parse(localStorage.getItem('accountList')) : []
// 页面加载完就触发我这个
async function getRate() {
    const result = await exchangeRate({
        "from_money": ChineseToCode("美元"),
        "to_money": ChineseToCode("人民币"),
        "from_money_num": "1",
        "srcid": "5293",
        "sid": "60277_61027_60853_61362_61679_61734_61780_61822_61844_61777_61804_61879_61986",
    })
    return result
}
// 时间格式化
function formatTime(date = new Date(), format = 'YYYY-MM-DD HH:mm:ss') {
    const padZero = (num) => (num < 10 ? '0' + num : num);

    const year = date.getFullYear();
    const month = padZero(date.getMonth() + 1); // getMonth() 返回0-11，因此加1
    const day = padZero(date.getDate());
    const hours = padZero(date.getHours());
    const minutes = padZero(date.getMinutes());
    const seconds = padZero(date.getSeconds());

    return format.replace(/YYYY/, year)
        .replace(/MM/, month)
        .replace(/DD/, day)
        .replace(/HH/, hours)
        .replace(/mm/, minutes)
        .replace(/ss/, seconds);
}

// 如果用户一次性下载多个亚马逊视频,这个地方用来存储等会要下载的数据
let amazonVideoList = []

// 直接监听
let once = true
chrome.webRequest.onBeforeRequest.addListener(
    function(details) {
        console.log('转化到了')
        let rawFormData = details.requestBody.raw;
        let decoder = new TextDecoder('utf-8');
        sendOrderData = decoder.decode(rawFormData[0].bytes)
        // 这个地方 告诉contentjs即可
        setTimeout(() => {
            MessageToWindow(currentActiveId, 'hasOrderData')   
        }, 2000);
                
    },
    {urls: ["https://agentseller-us.temu.com/mms/eagle/package/online/query_sku_history_package"]}, // 根据需要调整URL过滤规则
    ["blocking", "requestBody"] // 请求权限以访问请求体
);

chrome.runtime.onMessage.addListener(async (params, sender, sendResponse) => {
    const XLSX = require('xlsx')
    /** @description demo */
    // async function mergeTsToMp4(files, outputFileName) {
    //     files.forEach(async file => {
    //         ffmpeg.FS("writeFile", "demo", await fetchFile(file));
    //     })
    //     await ffmpeg.run('-i', "demo", '-r', '120', 'output.mp4');
    //     const data = ffmpeg.FS('readFile', 'output.mp4');
    //     // 合并完了,要下载了
    //     const downloadUrl = window.URL.createObjectURL(new Blob([data.buffer], {type:'video/mp4'}))
    //     console.log(downloadUrl)
    //     const AmazonVideoEl = document.createElement('a')
    //     AmazonVideoEl.href = downloadUrl
    //     AmazonVideoEl.download = "demo.mp4"
    //     document.body.appendChild(AmazonVideoEl)
    //     AmazonVideoEl.click()
    // }
    // 使用示例
    if (!ffmpeg.isLoaded()) {
        await ffmpeg.load(); // 如果未加载，则加载
    }
    chrome.cookies.getAll({ url: "https://seller.kuajingmaihuo.com" }, function (cookies) {
        console.log("Cookies for www.example.com:", cookies)
        goodListCookie = cookies.map(item => `${item.name}=${item.value}`).join(';')
    })
    // mergeTsToMp4([], 'mergedVideo.mp4');
    if (params.message === 'getRate') {
        const result = await getRate();
        // 把汇率的信息发送给前台
        // 发给Content,Content展示到前台
        chrome.tabs.query({ active: true }, (tabs) => {
            console.log(tabs, '233')
            // 当前所在的网页
            const currentTab = tabs.filter(item => item.active)
            const currentWindow = currentTab.length && currentTab[0]
            console.log(currentWindow, '2')
            currentActiveId = currentWindow.id
            MessageToWindow(currentWindow.id, 'rate', result)
        })
    } else if (params.message === 'getAbroadStock') {
        // 证明进来的这个地方是要去发送请求,拿到我shipout的token,一般一次就是24小时,先从本地拿
        accountList = localStorage.getItem('accountList')
        if (!accountList) {
            // 直接显示一个加号,让用户自行添加,这个地方直接点击添加账号就行了,不用我咋操作
        }
    } else if (params.message === 'login') {
        console.log('来啦')
        let { phone, pwd } = params.data
        // 去登录,看看咋个事,拿到请求的结果,然后显示我看看先
        const url = 'https://oms.shipout.com/api/auth-server/oauth/token'
        await getTokenByPhone({
            url,
            phone,
            pwd
        })
    } else if (params.message == 'getStockInThis') {
        // 每次拿的时候,都要重新刷新下存储
        stockAllInfo.length = 0
        // 获取数据之后发给content.js 这个地方要去发请求并且,携带token
        if (!params.data.length) {
            // 证明当前是没有账号的,点击就是无效的,打印console就行了
            console.log('当前并没有账号,请添加后再次点击')
        } else {
            let stockInfo, getPaiPaiStock, getHouseUrl;
            const flag = await getAllStock(params, stockInfo, getPaiPaiStock, getHouseUrl)
            if (flag.length) {
                // 证明有问题,那么这个时候就要那个啥了,重新获取里面的token,然后重新传递进去
                const url = 'https://oms.shipout.com/api/auth-server/oauth/token'
                const reflashList = []
                for (let index = 0; index < flag.length; index++) {
                    const globalToken = await getTokenByPhone({
                        url,
                        phone: flag[index].phone,
                        pwd: flag[index].pwd,
                    }, true)
                    reflashList.push({
                        phone: flag[index].phone,
                        pwd: flag[index].pwd,
                        token: globalToken
                    })
                }
                console.log('这是需要重新发请求的', reflashList)
                // 这个地方直接更新就行了
                for (let index = 0; index < reflashList.length; index++) {
                    const errorItem = reflashList[index]
                    const SaveItem = accountList.find(item => item.phone == errorItem.phone)
                    SaveItem.token = reflashList[index].token
                }
                // 更新本地的存储数据
                localStorage.setItem('accountList', JSON.stringify(accountList))
                // 搞完就要开始去拿stock了,看看是哪个函数,一般搞完就是一次性过了,不会再返回了,如果有就提醒研发来看吧
                const flag2 = await getAllStock({
                    data: reflashList
                }, stockInfo, getPaiPaiStock, getHouseUrl)
                if (flag2.length) {
                    // 咨询研发,或者直接把账号删除,重新添加
                    console.log('咨询研发,或者直接把账号删除,重新添加')
                }
            }
            // 循环完事了就要发给contentjs了
            // 传过去的时候先格式化一次
            // 这个地方去拿一下数据吧,通过那个cookie
            const PaiPaiHeader = new Headers()
            const xiaomiCookie = localStorage.getItem('dianxiaomicookie')
            let xiaomiData = []
            if (xiaomiCookie) {
                PaiPaiHeader.append('Cookie', xiaomiCookie)
                PaiPaiHeader.append('Content-Type', 'application/json')
                for (let index = 0; index < PaiPaiWrehouseId.length; index++) {
                    const PaiPaiResult = await fetch('https://pcpc.jfwms.net/oms/inventory/list', {
                        method: 'POST',
                        body: JSON.stringify({
                            "warehouseId": PaiPaiWrehouseId[index].id,
                            "inquireType": 2,
                            "searchType": "sku",
                            "searchContent": "",
                            "orderBy": "sku",
                            "desc": 2,
                            "pageNo": 1,
                            "pageSize": 50
                        }),
                        headers: PaiPaiHeader
                    }).then(res => res.json())
                    // 判断一下
                    if (!PaiPaiResult.status) {
                        const reg = /[A-Za-z0-9!@_]+(?:-[A-Za-z0-9@!_]+(?:\s(?=.*[a-zA-Z]+)[a-zA-Z0-9]+)?)+/
                        // 证明成功了,那就进行格式化,再发到前台去
                        let forMatData = PaiPaiResult.data.page.rows.map(item => {
                            const isFormatSku = reg.test(item.name)
                            // 匹配不到
                            if (!isFormatSku) {
                                // 换一个正则判断是不是全部djaljdlaj这种
                                const reg2 = /[A-Za-z0-9@!_]{8,}/
                                const itemSku2 = reg2.exec(item.name)
                                if (itemSku2) {
                                    // 证明是,那还是一样
                                    return {
                                        ItemName: item.name,
                                        ItemSku: itemSku2[0].replace(/@/, ''),
                                        ItemStock: item.total,
                                        subItemList: [{
                                            warehouseName: item.warehouseName,
                                            omsAvailableQuantity: item.total
                                        }]
                                    }
                                } else {
                                    // 不然这种情况下,就只能是Sku了,直接返回
                                    return {
                                        ItemName: item.sku,
                                        ItemSku: item.sku.replace(/@/, ''),
                                        ItemStock: item.total,
                                        subItemList: [{
                                            warehouseName: item.warehouseName,
                                            omsAvailableQuantity: item.total
                                        }]
                                    }
                                }
                            } else {
                                return {
                                    ItemName: item.name,
                                    ItemSku: reg.exec(item.name)[0].replace(/@/, ''),
                                    ItemStock: item.total,
                                    subItemList: [{
                                        warehouseName: item.warehouseName,
                                        omsAvailableQuantity: item.total
                                    }]
                                }
                            }

                        })
                        if (xiaomiData.length) {
                            // 证明有,这个时候forMatData已经格式化好了,开始来合并
                            xiaomiData.forEach(data_item => {
                                const sameItem = forMatData.find(format_item => format_item.ItemSku === data_item.ItemSku);
                                if (sameItem) {
                                    // 如果存在就合并
                                    data_item.ItemStock += +sameItem.ItemStock
                                    data_item.subItemList = data_item.subItemList.concat(sameItem.subItemList)
                                }
                            })
                        } else {
                            xiaomiData = xiaomiData.concat(forMatData)
                        }
                    }
                    await delayFn()
                }
                // console.log(PaiPaiResult, '派派的数据')
            }
            MessageToWindow(currentActiveId, 'StockInfo', {
                statu: 200,
                msg: "库存信息获取成功",
                data: stockAllInfo.concat(xiaomiData)
            })
        }
    } else if (params.message == 'dianxiaomicookie') {
        // 我拿到了,看看Cookie是多少
        console.log(params.cookie)
        // 只要拿到了,就把Cookie存储起来
        localStorage.setItem('dianxiaomicookie', params.cookie)
    } else if (params.message == 'downloadFile') {
        // 拿到了
        console.log(params.data, '拿到了')
        const myHeader = new Headers()
        myHeader.append('cookie', currentCookie)
        myHeader.append('Mallid', currentMallId)
        myHeader.append('Content-Type', 'application/json')
        // const one_url = 'https://pftka-us.temu.com/pmm/api/pmm/defined'

        const url = 'https://agentseller-us.temu.com/mms/eagle/package/main_batch_query'
        const response = await fetch(url, {
            method: 'POST',
            headers: myHeader,
            body: JSON.stringify({
                "page_number": 1,
                "page_size": 200,
                "sort_type": 1,
                // "call_begin_time": 1737289443,
                // "call_end_time": 1739881443
            })
        }).then(res => res.json())
        console.log(response)
        let format_Data = []
        let globalOrderList = []
        let xlsxData = [[
            '订单号', '参考号', '平台',
            '发货仓库', '面单类型', '物流',
            '运单号', '商品SKU', '商品单价',
            '数量', '订单金额', '币种',
            '收件人', '手机号', '邮箱',
            '邮政编码', '国家', '省/州',
            '市/府', '区/县', '详细地址',
            '详细地址2'
        ]]
        if (params.type === 'shipout') {
            xlsxData = [[
                'Order NO',
                'SKU',
                'SKU Qty',
                'Tag',
                'Request Ship Date',
                'Recipient Name',
                'Recipient Company',
                'Recipient Address Line 1',
                'Recipient Address Line 2',
                'Recipient State',
                'Recipient City',
                'Recipient ZipCode',
                'Recipient Country',
                'Recipient Phone',
                'Recipient Email',
                'Request Shipping Service',
                'Warehouse Customized Service Name',
                'Signature Option',
                'Tracking Number',
                'Shipping Carrier',
                'Insurance',
                'Cod',
                'Notes'
            ]]
        }
        const dirName = formatTime(new Date(), 'MM月DD日HH时mm分')
        if (response.success) {
            format_Data = response.result.package_info_result_list.filter((item, index) => {
                if (params.data.includes(item.order_send_info_list[0].parent_order_sn)) {
                    console.log(item, index)
                    return true
                    // return {
                    //     Po: item.order_send_info_list[0].parent_order_sn,
                    //     Pk: item.package_sn
                    // }
                }
            })
            // 这个地方去拿订单列表
            const order_url = 'https://agentseller-us.temu.com/kirogi/bg/mms/recentOrderList'
            // 拿到所有的订单
            let currentPage = 1
            async function getData(order_url, size, data) {
                const order_response = await fetch(order_url, {
                    method: 'POST',
                    headers: myHeader,
                    body: JSON.stringify({
                        "fulfillmentMode": 0,
                        "pageNumber": size,
                        "pageSize": 100,
                        "queryType": 4,
                        "sortType": 3,
                        "timeZone": "UTC+8",
                        "parentAfterSalesTag": 0,
                        "sellerNoteLabelList": []
                    })
                }).then(res => res.json())
                if (order_response.success) {
                    const { pageItems } = order_response.result
                    data.push(...pageItems)
                    // 判断,如果是就继续请求
                    let currentPageSize = currentPage * 100
                    if (order_response.result.totalItemNum > currentPageSize) {
                        await delayFn()
                        // 继续请求
                        currentPage += 1
                        await getData(order_url, currentPage, data)
                    }
                }
            }
            await getData(order_url, 1, globalOrderList)
            for (let i = 0; i < format_Data.length; i++) {
                const item = format_Data[i];
                const warehouseName = formatWareHouseName(item.warehouse_name);
                // 包裹号: PK-0295704792268953147
                const currentOrder = globalOrderList.find(order => {
                    // 看看我的订单有没有list, 没有的话 就用订单号去匹配
                    if (order.orderList[0].orderPackageInfoList === null) {
                        if (order.parentOrderMap.parentOrderSn === item.order_send_info_list[0].parent_order_sn) {
                            return true
                        } else {
                            return false
                        }
                    }
                    if (order.orderList[0].orderPackageInfoList[0].packageSn === item.package_sn) {
                        return true;
                    }
                });
                console.log('当前找到的', currentOrder, item, globalOrderList)
                // 在这里还要拿到用户的信息
                const user_url = 'https://agentseller-us.temu.com/mms/orchid/address/snapshot/order_shipping_address_query';
                const user_response = await fetch(user_url, {
                    method: 'POST',
                    headers: myHeader,
                    body: JSON.stringify({
                        "parent_order_sn": item.order_send_info_list[0].parent_order_sn
                    })
                }).then(res => res.json());

                if (user_response.success) {
                    console.log(user_response)
                    if (params.type === 'shipout') {
                        xlsxData.push([
                            item.order_send_info_list[0].parent_order_sn,
                            currentOrder?.orderList[0].extCodeList[0],
                            item.order_send_info_list[0].quantity,
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            '',
                            'US',
                            '',
                            '',
                            'Upload Shipping Label',
                            '',
                            '',
                            item.tracking_number,
                            item.shipping_company_name,
                            item.warehouse_name,
                            '',
                            ''
                        ]);
                    }
                    else {
                        xlsxData.push([
                            item.order_send_info_list[0].parent_order_sn,
                            '',
                            'TEMU',
                            warehouseName,
                            '自有面单',
                            item.shipping_company_name,
                            item.tracking_number,
                            currentOrder?.orderList[0].extCodeList[0],
                            '',
                            item.order_send_info_list[0].quantity,
                            '',
                            '',
                            user_response.result.receipt_name,
                            '',
                            '',
                            '',
                            'US',
                            '',
                            '',
                            '',
                            '',
                            ''
                        ]);
                    }
                    console.log(globalOrderList, currentOrder, user_response, xlsxData);
                }
            }
            // 创建一个表下载
            const ws = XLSX.utils.aoa_to_sheet(xlsxData);
            // 创建一个工作表
            const new_wb = XLSX.utils.book_new();
            // 写入
            XLSX.utils.book_append_sheet(new_wb, ws, "sheet1");
            XLSX.writeFileXLSX(new_wb, `${dirName}/半托订单信息表.xlsx`);
            // 格式化仓库名称
            function formatWareHouseName(warehouse) {
                let warehouseName = ''
                const houseList = PaiPaiWrehouseId.filter(item => item.relas === warehouse)
                if (houseList.length) {
                    warehouseName = houseList[0].name
                }
                if (warehouseName) {
                    return warehouseName
                } else {
                    return warehouse
                }
            }
            console.log(format_Data)
        }
        // 去请求pdf地址
        const pdf_url = 'https://agentseller-us.temu.com/mms/eagle/package/batch_print_shipping_label'
        const downloadList = []
        function getUrl() {
            format_Data.forEach(async (value, index) => {
                const pdf_data = {
                    "package_sn_list": [
                        value.package_sn
                    ],
                    "download": true,
                    "merge_files": true,
                    "batch_event_type": 1
                }
                const result = await fetch(pdf_url, {
                    method: 'POST',
                    body: JSON.stringify(pdf_data),
                    headers: myHeader
                }).then(res => res.json())
                console.log(result)
                if (result.success) {
                    // 拿到了，那就先拿地址，然后下载
                    const url = result.result.merged_shipping_label_url
                    downloadList.push({
                        fileName: `${value.order_send_info_list[0].parent_order_sn}.pdf`,
                        url
                    })
                    console.log(downloadList, result.result)
                }
                await delayFn()
                if (index === format_Data.length - 1) {
                    // 这个是告诉contentjs的,但是我们用download的api就不用这个方式了 
                    //  MessageToWindow(currentActiveId, 'downloadOrder', {
                    //     list: downloadList,
                    //     dirName
                    //  })
                    downloadList.forEach(async item => {
                        console.log(item)
                        chrome.downloads.download({
                            url: item.url,
                            saveAs: false, // true的话会弹出让你确认保存地址的窗,设置false
                            filename: `${dirName}/${item.fileName}`, //这样就可以了,不要出现../ .这些也不要出现/ 直接开头就是本地浏览器保存的文件夹目录下了
                            conflictAction: 'uniquify'
                        })
                        await delayFn()
                    })
                }
            })
        }
        getUrl()
        // 去前台拿一个id
    } else if (params.message == "getId") {
        console.log(params.data, '我是id')
        currentCookie = params.data.cookie
        currentMallId = params.data.id
        // 存储到本地
        localStorage.setItem('normalCookie', params.data.cookie)
        localStorage.setItem('mallid', currentMallId)
    } else if (params.message == "customPath") {
        // 测试代码,测试chrome.downloads用的
        // console.log(params.data, '我是路径')
        // chrome.downloads.download({
        //     url: params.data,
        //     saveAs: false, // true的话会弹出让你确认保存地址的窗,设置false
        //     filename: 'demo/123.jpg', //这样就可以了,不要出现../ .这些也不要出现/ 直接开头就是本地浏览器保存的文件夹目录下了
        //     conflictAction: 'uniquify'
        // }, () => {
        //     console.log('开始下载了哈')
        // })
    } else if (params.message == 'checkCode') {
        let code = ''
        // 这个地方是去验证验证码
        console.log(params.data, '我是验证码')
        // 验证成功了, 然后去请求数据
        // 60077.2027y.866a4a5b-c4f6-4b90-ae16-789b53a937b1
        // 43569.2027y.24696
        const info = params.data.code
        // 76340.2027y.e6d1cfb3-9ae3-4f32-b71a-eedbc6374ce6$y50659
        const key = atob(params.data.param)
        // 传递的info,先存起来中间那个y的,和那个246的,以及存储key
        if (info.trim() && key.trim()) {
            // 验证下是否已经到期
            const failedTime = key.split('.')[3] + key.split('.')[0]
            const currentTime = new Date().getTime()
            console.log(failedTime, currentTime)
            if (currentTime - failedTime > 1000 * 120) {
                // 相当于已经超时一秒了,那么就是验证不过
                MessageToPopup('vertifyResult', {
                    statu: false
                })
                return
            }
            code = key.split('.')[2]
            if (code === info) {
                // 存储code
                currentCode = info
                // 告诉popup
                MessageToPopup('vertifyResult', {
                    statu: true
                })
            }
        }
    } else if (params.message == 'loginCode') {
        // 这次是登录了,不过,得验证下
        if (params.data.param.trim()) {
            // 拿code
            const format_code = atob(params.data.param)
            const codeEl = format_code.split('.')[2].split('$y')[1]
            const timeEl = format_code.split('.')[1]
            // 进行对比
            if (codeEl == currentCode) {
                try {
                    // 要去判断下,要在本地存什么了
                    const danwei = timeEl.slice(-1,)
                    // 时间
                    const time = +timeEl.slice(0, timeEl.length - 1)
                    let stramp = ''
                    switch (danwei) {
                        case 'y':
                            stramp = 1000 * 60 * 60 * 24 * 365 * time
                            break;
                        case 'm':
                            stramp = 1000 * 60 * 60 * 24 * 30 * time
                            break;
                        case 'd':
                            stramp = 1000 * 60 * 60 * 24 * time
                            break;
                        case 'w':
                            stramp = 1000 * 60 * 60 * 24 * 7 * time
                            break;
                        case 'h':
                            stramp = 1000 * 60 * 60 * time
                            break;
                        case 'f':
                            stramp = 1000 * 60 * time
                    }
                    console.log(new Date().getTime() + stramp)
                    localStorage.setItem('times', new Date().getTime() + stramp)
                } catch (err) {
                    MessageToPopup("loginResult", {
                        statu: false
                    })
                    return
                }
                // 通过了
                MessageToPopup("loginResult", {
                    statu: true
                })
            }
        }
    } else if (params.message == 'download_TEMU_Pic') {
        const size = params.size
        switch (size) {
            case '180':
            case '800':
                const currentT = new Date().getTime()
                for (let index = 0; index < params.downloadList.length; index++) {
                    const downloadItem = params.downloadList[index]
                    chrome.downloads.download({
                        url: downloadItem[size],
                        saveAs: false,
                        filename: `${currentT}TEMU商品图/${downloadItem.imgName}`,
                        conflictAction: 'uniquify'
                    })
                    await delayFn()
                }
                break;
            default:
                console.log('暂无对应的资源下载')
        }
    } else if (params.message == 'download_TEMU_Video') {
        chrome.downloads.download({
            url: params.videoHref,
            saveAs: false,
            filename: `视频.mp4`,
            conflictAction: 'uniquify'
        })
    } else if (params.message == 'download_amazon_Video') {
        amazonVideoList.unshift(params.tsFileList)
        if (amazonVideoList.length === 1) {
            await downloadAmazonVideo(amazonVideoList.pop())
        }

    } else if (params.message == 'downloadAmazonPic') {
        let picList = params.picList
        picList = picList.map(item => /http.*\.jpg/.exec(item)[0])
        if (picList.length) {
            // 直接下载,然后命名的话就01到...吧
            let dateEl = new Date()
            picList.forEach(async (item, index) => {
                chrome.downloads.download({
                    url: item,
                    saveAs: false,
                    filename: `amazon-${dateEl.getFullYear()}年${dateEl.getMonth() + 1}月${dateEl.getDate()}日/${index + 1}.jpg`,
                    conflictAction: 'uniquify'
                })
                await delayFn()
            })
        }
    } else if (params.message == 'downloadAliExpressPic') {
        // 下载
        if (params.picList.length) {
            params.picList.forEach((item, index) => {
                chrome.downloads.download({
                    url: item.replace(/_\.avif/, ''),
                    saveAs: false,
                    filename: `aliexpress/商品图${index + 1}.jpg`,
                    conflictAction: 'uniquify'
                })
            })
        }
    } else if (params.message == 'getGoodRate') {
        console.log(params.data)
        // 这个是算售后率的 有点点瑕疵 后续要改进 查询七月份数据的时候 出现了五单的收回没拿到的情况
        if (!params.data.startTime && !params.data.endTime) {
            console.log('没选时间,弹窗')
            alert('没有选择开始和结束的时间')
            return
        }
        const startTime = new Date(`${params.data.startTime} 00:00:00`).getTime()
        const endTime = new Date(`${params.data.endTime} 23:59:59`).getTime()
        // 去拿美国订单
        let get_url = 'https://agentseller-us.temu.com/kirogi/bg/mms/recentOrderList?is_back=1'
        const myHeader = new Headers()
        myHeader.append('cookie', currentCookie)
        myHeader.append('Mallid', currentMallId)
        myHeader.append('Content-Type', 'application/json')
        let currentNum = 1
        // 获取数据
        async function getAllBackList(back_url, list, data) {
            const backResult = await fetch(back_url, {
                method: 'POST',
                headers: myHeader,
                body: JSON.stringify(data)
            }).then(res => res.json())
            if (backResult.success) {
                // 有订单的数据
                if (backResult.result.mmsPageVO) {
                    list.push(...backResult.result.mmsPageVO.data)
                    if (data.pageNumber * 100 < backResult.result.mmsPageVO.totalCount) {
                        // 继续拿
                        currentNum += 1
                        await delayFn()
                        data.pageNumber += 1
                        await getAllBackList(back_url, list, data)
                    } else {
                        return
                    }
                } else {
                    list.push(...backResult.result.pageItems.filter(item => item.orderList[0].orderSendInfo.refuseSendReason))
                    if (data.pageNumber * 500 < backResult.result.totalItemNum) {
                        // 继续拿
                        currentNum += 1
                        await delayFn()
                        data.pageNumber += 1
                        await getAllBackList(back_url, list, data)
                    } else {
                        return
                    }
                }
            }
        }
        // 创建一个新的工作簿
        const workxlsx = XLSX.utils.book_new()
        // 拿已签收的订单
        const result = await fetch(get_url, {
            method: 'POST',
            headers: myHeader,
            body: JSON.stringify({
                "fulfillmentMode": 0,
                "pageNumber": currentNum,
                "pageSize": 500,
                "queryType": 5,
                "sortType": 3,
                "parentOrderTimeStart": startTime / 1000, // 这个是秒数不是毫秒,要用new Date 得乘1000
                "parentOrderTimeEnd": endTime / 1000,
                "timeZone": "UTC+8",
                "parentAfterSalesTag": 0,
                "sellerNoteLabelList": []
            })
        }).then(res => res.json())
        if (result.success) {
            console.log(result)
            // 证明拿到了
            let ItemList = [...result.result.pageItems]
            if (result.result.totalItemNum < currentNum * 500) {
            } else {
                currentNum += 1
                await getAllBackList(get_url, ItemList, {
                    "fulfillmentMode": 0,
                    "pageNumber": currentNum,
                    "pageSize": 500,
                    "queryType": 5,
                    "sortType": 3,
                    "parentOrderTimeStart": startTime / 1000, // 这个是秒数不是毫秒,要用new Date 得乘1000
                    "parentOrderTimeEnd": endTime / 1000,
                    "timeZone": "UTC+8",
                    "parentAfterSalesTag": 0,
                    "sellerNoteLabelList": []
                })
            }
            // 接下来要拿已取消里面有订单号的数据
            await getAllBackList(get_url, ItemList, {
                "fulfillmentMode": 0,
                "pageNumber": 1,
                "pageSize": 500,
                "queryType": 3,
                "sortType": 3,
                "parentOrderTimeStart": startTime / 1000, // 这个是秒数不是毫秒,要用new Date 得乘1000
                "parentOrderTimeEnd": endTime / 1000,
                "timeZone": "UTC+8",
                "parentAfterSalesTag": 0,
                "sellerNoteLabelList": []
            })
            console.log(ItemList, '这是所有有效的订单')
            ItemList = ItemList.filter(item => {
                if (item.orderList[0].orderPackageInfoList) {
                    // 证明是发货了的,不管他是不是取消的,先存储起来
                    return true
                } else {
                    return false
                }
            })
            console.log(ItemList, ItemList.length)
            if (ItemList.length) {
                // 证明这些都是成交的单子
                // 现在查售后
                let back_url = 'https://agentseller-us.temu.com/garen/mms/afterSales/queryReturnAndRefundPaList'
                const backResult = await fetch(back_url, {
                    method: 'POST',
                    headers: myHeader,
                    body: JSON.stringify({
                        "pageNumber": 1,
                        "pageSize": 100,
                        "startCreatedTime": startTime, //这个是毫秒
                        "endCreatedTime": new Date().getTime(),
                        "groupSearchType": 2110,
                        "timeSearchType": 5000,
                        "reverseSignedTimeSearchType": 7000,
                        "selectOnlyRefund": true,
                        "selectReturnRefund": true
                    })
                }).then(res => res.json())
                let resultNum = 1
                if (backResult.success) {
                    // 有退款的数据
                    let backList = [...backResult.result.mmsPageVO.data]
                    if (resultNum * 100 < backResult.result.mmsPageVO.totalCount) {
                        resultNum += 1
                        await getAllBackList(back_url, backList, {
                            "pageNumber": resultNum,
                            "pageSize": 100,
                            "startCreatedTime": startTime, //这个是毫秒
                            "endCreatedTime": new Date().getTime(),
                            "groupSearchType": 2110,
                            "timeSearchType": 5000,
                            "reverseSignedTimeSearchType": 7000,
                            "selectOnlyRefund": true,
                            "selectReturnRefund": true
                        })
                    }
                    // 循环我的订单 获取一个二维数组
                    // ['sku', '出单量', '售后单量', '售后率']
                    let resultData = [['sku', '出单量', '售后单量', '售后率']]
                    let orderData = [['订单号', 'sku', '数量', 'skc', 'skuId', '包裹号', '物流商', '物流单号', '状态']]
                    let errorData = [[['订单号', 'sku', '数量', 'skc', 'skuId', '包裹号', '物流商', '物流单号', '状态']]]
                    ItemList.forEach(successItem => {
                        // 这个地方顺便格式化下我的订单
                        // 先算我所有的单子先
                        let errorItemNum = 0
                        let successItemNum = 1
                        let sku = null
                        let findSuccessItem = null
                        let runInfo = null
                        let goodInfo = null
                        // 分开判断的,如果说orderList不是一的要单独找
                        if (successItem.orderList.length >= 2) {
                            findSuccessItem = backList.find(item => {
                                let findItem = successItem.orderList.find(order => order.parentOrderSn === item.parentOrderSn)
                                if (findItem) {
                                    debugger;
                                    sku = findItem.extCodeList[0]
                                    runInfo = findItem.orderPackageInfoList[0]
                                    goodInfo = findItem.productInfoList[0]
                                    return true
                                } else {
                                    return false
                                }
                            })
                        }
                        if (!findSuccessItem) {
                            sku = successItem.orderList[0].extCodeList[0]
                            runInfo = successItem.orderList[0].orderPackageInfoList[0]
                            goodInfo = successItem.orderList[0].productInfoList[0]
                            findSuccessItem = backList.find(item => item.afterSalesItemVOList[0].orderSn === successItem.orderList[0].orderSn)
                        }

                        orderData.push([successItem.parentOrderMap.parentOrderSn, sku, goodInfo.productQuantity, goodInfo.productSkcId, goodInfo.productSkuId, runInfo.packageSn, runInfo.companyName, runInfo.trackingNumber, successItem.addressInvisibleDesc])
                        if (findSuccessItem && resultData.length === 1) {
                            // errorItemNum = findSuccessItem.afterSalesItemVOList[0].applyReturnGoodsNumber
                            // 证明有退单,那么就记录
                            let rateNum = (errorItemNum / successItemNum).toFixed(3) * 100
                            console.log(findSuccessItem)
                            resultData.push([sku, successItemNum, 1, rateNum ? rateNum + '%' : 0])
                            errorData.push([successItem.parentOrderMap.parentOrderSn, sku, goodInfo.productQuantity, goodInfo.productSkcId, goodInfo.productSkuId, runInfo.packageSn, runInfo.companyName, runInfo.trackingNumber, successItem.addressInvisibleDesc])
                        } else if (findSuccessItem) {
                            // 找到了, 但是不是第一个了,所以要找
                            let currentItem = resultData.find(item => item[0] === sku)
                            if (currentItem) {
                                // 找到了就更新
                                currentItem[1] += 1
                                currentItem[2] += 1
                                let rateNum = (currentItem[2] / currentItem[1]).toFixed(3) * 100
                                currentItem[3] = rateNum ? rateNum + '%' : 0
                            } else {
                                let rateNum = (errorItemNum / successItemNum).toFixed(3) * 100
                                resultData.push([sku, successItemNum, 1, rateNum ? rateNum + '%' : 0])
                            }
                            errorData.push([successItem.parentOrderMap.parentOrderSn, sku, goodInfo.productQuantity, goodInfo.productSkcId, goodInfo.productSkuId, runInfo.packageSn, runInfo.companyName, runInfo.trackingNumber, successItem.addressInvisibleDesc])
                        } else {
                            // 没找到,证明不是退货呀判断
                            let currentItem = resultData.find(item => item[0] === sku)
                            if (currentItem) {
                                if (currentItem[2] >= 4) {
                                }
                                // 找到了就更新
                                currentItem[1] += 1
                                let rateNum = (currentItem[2] / currentItem[1]).toFixed(3) * 100
                                currentItem[3] = rateNum ? rateNum + '%' : 0
                            } else {
                                resultData.push([sku, successItemNum, 0, 0])
                            }
                        }
                    })
                    console.log('这是格式化之后的数据,看看', resultData)
                    // 把售后率数据线转成工作表
                    const backWorkSheet = XLSX.utils.aoa_to_sheet(resultData)
                    // 把订单转成工作表
                    const orderWorkSheet = XLSX.utils.aoa_to_sheet(orderData)
                    // 把退货转成工作表
                    const errorWorkSheet = XLSX.utils.aoa_to_sheet(errorData)
                    // 订单数据转成工作表
                    XLSX.utils.book_append_sheet(workxlsx, orderWorkSheet, '美国站总订单')
                    XLSX.utils.book_append_sheet(workxlsx, errorWorkSheet, '美国站退款订单')
                    XLSX.utils.book_append_sheet(workxlsx, backWorkSheet, '美国站售后率')
                    XLSX.writeFile(workxlsx, 'back/example.xlsx')
                }
                console.log('看看我的退款', backResult)
            }
        }
        // 去拿全球订单,除了美国和欧洲 这个地方是拿加拿大的 暂时不写
        get_url = 'https://agentseller.temu.com/kirogi/bg/mms/recentOrderList?is_back=1'
        // const Allresult = await fetch(get_url, {
        //     method: 'POST',
        //     headers: myHeader,
        //     body: JSON.stringify({
        //         "fulfillmentMode": 0,
        //         "pageNumber": 1,
        //         "pageSize": 500,
        //         "queryType": 0,
        //         "sortType": 1,
        //         "parentOrderTimeStart": startTime / 1000, // 这个是秒数不是毫秒,要用new Date 得乘1000
        //         "parentOrderTimeEnd": endTime / 1000,
        //         "timeZone": "UTC+8",
        //         "parentAfterSalesTag": 0,
        //         "sellerNoteLabelList": []
        //     })
        // }).then(res => res.json())
        // if (Allresult.success) {
        //    // 证明拿到了
        //    let ItemList = Allresult.result.pageItems
        //    ItemList = ItemList.filter(item => item.parentOrderMap.addressInvisibleDesc)
        //    console.log(ItemList, ItemList.length)
        //    if (ItemList.length) {
        //        // 证明这些都是成交的单子
        //        // 现在查售后
        //        let backResult = []
        //        let back_url = 'https://agentseller.temu.com/garen/mms/afterSales/queryReturnAndRefundPaList'
        //        async function getAllBackList(back_url, list) {
        //             const backResult = await fetch(back_url, {
        //                 method: 'POST',
        //                 headers: myHeader,
        //                 body: JSON.stringify({
        //                     "pageNumber": 1,
        //                     "pageSize": 100,
        //                     "startCreatedTime": startTime, //这个是毫秒
        //                     "endCreatedTime": new Date().getTime(),
        //                     "groupSearchType": 2110,
        //                     "timeSearchType": 5000,
        //                     "reverseSignedTimeSearchType": 7000,
        //                     "selectOnlyRefund": true,
        //                     "selectReturnRefund": true
        //                 })
        //             }).then(res => res.json())
        //             if (backResult.success) {
        //                 // 有退款的数据
        //                 list.push(...backResult.result.mmsPageVO.data)
        //                 let allCount = Math.ceil(backResult.totalCount / backResult.pageSize)
        //                 if (allCount > backResult.pageNumber) {
        //                     // 继续拿
        //                     await delayFn()
        //                     await getAllBackList(back_url, list)
        //                 } else {
        //                     return
        //                 }
        //             }
        //        }
        //        await getAllBackList(back_url, backResult)
        //        if (backResult.success) {
        //            // 有退款的数据
        //            let backList = backResult.result.mmsPageVO.data
        //            // 循环我的订单 获取一个二维数组
        //            // ['sku', '出单量', '售后单量', '售后率']
        //            let resultData = [['sku', '出单量', '售后单量', '售后率']]
        //            let orderData = [['订单号', 'sku', '数量', 'skc', 'skuId', '包裹号', '物流商', '物流单号']]
        //            ItemList.forEach(successItem => {
        //                // 这个地方顺便格式化下我的订单
        //                // 先算我所有的单子先
        //                let errorItemNum = 0
        //                let successItemNum = 1
        //                let sku = successItem.orderList[0].extCodeList[0]
        //                let findSuccessItem = backList.find(item => item.afterSalesItemVOList[0].orderSn === successItem.orderList[0].orderSn)
        //                let runInfo = successItem.orderList[0].orderPackageInfoList[0]
        //                let goodInfo = successItem.orderList[0].productInfoList[0]
        //                orderData.push([successItem.parentOrderMap.parentOrderSn, sku, goodInfo.productQuantity, goodInfo.productSkcId, goodInfo.productSkuId, runInfo.packageSn, runInfo.companyName, runInfo.trackingNumber])
        //                if (findSuccessItem && resultData.length === 1) {
        //                    errorItemNum = 1
        //                    // errorItemNum = findSuccessItem.afterSalesItemVOList[0].applyReturnGoodsNumber
        //                    // 证明有退单,那么就记录
        //                    let rateNum = (errorItemNum / successItemNum).toFixed(3) * 100
        //                    resultData.push([sku, successItemNum, errorItemNum, rateNum ? rateNum + '%' : 0])
        //                } else if(findSuccessItem){
        //                    // 找到了, 但是不是第一个了,所以要找
        //                    let currentItem = resultData.find(item => item[0] === sku)
        //                    errorItemNum = 1
        //                    if (currentItem) {
        //                        // 找到了就更新
        //                        currentItem[1] += 1
        //                        currentItem[2] += 1
        //                        let rateNum = (currentItem[2] / currentItem[1]).toFixed(3) * 100
        //                        currentItem[3] = rateNum ? rateNum + '%' : 0
        //                    } else {
        //                        let rateNum = (errorItemNum / successItemNum).toFixed(3) * 100
        //                        resultData.push([sku, successItemNum, errorItemNum, rateNum ? rateNum + '%' : 0])
        //                    }
        //                } else {
        //                    // 没找到,证明不是退货呀判断
        //                    let currentItem = resultData.find(item => item[0] === sku)
        //                    if (currentItem) {
        //                        // 找到了就更新
        //                        currentItem[1] += 1
        //                        let rateNum = (currentItem[2] / currentItem[1]).toFixed(3) * 100
        //                        currentItem[3] = rateNum ? rateNum + '%' : 0
        //                    } else {
        //                        resultData.push([sku, successItemNum, errorItemNum, 0]) 
        //                    }
        //                }
        //            })
        //            console.log('这是格式化之后的数据,看看', resultData)
        //            // 把售后率数据线转成工作表
        //            const backWorkSheet = XLSX.utils.aoa_to_sheet(resultData)
        //            // 把订单转成工作表
        //            const orderWorkSheet = XLSX.utils.aoa_to_sheet(orderData)
        //            // 订单数据转成工作表
        //            XLSX.utils.book_append_sheet(workxlsx, orderWorkSheet, '美国站')
        //            XLSX.utils.book_append_sheet(workxlsx, backWorkSheet, '美国站售后率')
        //            XLSX.writeFile(workxlsx, 'back/example.xlsx')
        //        }
        //        console.log('看看我的退款', backResult)
        //    }
        // }
    } else if (params.message == 'getAllGoodAndActivity') {
        const myHeader = new Headers()
        myHeader.append('Content-Type', 'application/json')
        const result = await fetch(baseURL + '/getGoodList', {
            method: 'POST',
            body: JSON.stringify({
                mallid: currentMallId,
                cookie: goodListCookie
            }),
            headers: myHeader
        }).then(res => res.json())
        // 这个地方要进行格式化,然后保存起来
        if (result.statu === 200) {
            // 格式化
            let format_result = result.data.map(item => ({
                linkSkc: item.productSkcId,
                linkSku: item.productSkuSummaries.map(sku => ({
                    itemName: sku.extCode,
                    itemSku: sku.productSkuId,
                    itemStock: sku.productSkuSemiManagedStock.skuStockQuantity,
                    itemType: sku.currencyType,
                    itemPrice: sku.siteSupplierPrices[0].supplierPrice / 100
                }))
            }))
            console.log('格式化后,保存本地', format_result)
            localStorage.setItem(currentMallId + 'currentArgCount', JSON.stringify(format_result))
        }
        // 去拿活动的数据
        const activityList = await fetch(baseURL + '/getActivity', {
            method: 'POST',
            body: JSON.stringify({
                mallid: currentMallId,
                cookie: goodListCookie
            }),
            headers: myHeader
        }).then(res => res.json())
        if (activityList.statu === 200) {
            // 看看活动
            // 抽取有用的,并且格式化下
            const canUseActivity = activityList.data.filter(activity => activity.canEditStock).map(item => ({
                activityName: item.activityThematicName + '-' + item.activityTypeName,
                activitydstartTime: item.assignSessionList[0].startDateStr,
                activitydendTime: item.assignSessionList[0].endDateStr,
                activityStock: item.activityStock,
                activityArgStock: item.remainingActivityStock,
                activitySaleStock: item.activityStock - item.remainingActivityStock,
                activityList: item.skcList.map(order => ({ itemSkc: order.skcId, child: order.skuList.map(child => ({ itemHuoHao: child.extCode, itemDelayPrice: child.sitePriceList[0].dailyPrice, itemActivePrice: child.sitePriceList[0].activityPrice, itemSku: child.skuId })) }))
            }))
            console.log('格式化后,保存本地', canUseActivity)
            localStorage.setItem(currentMallId + 'canUseActivity', JSON.stringify(canUseActivity))
            console.log('当前保存的时间也要记录')
            localStorage.setItem('lastUpdateTime', new Date().getTime())
        }
    } else if (params.message == 'getCurrentActivity') {
        const myHeader = new Headers()
        myHeader.append('Content-Type', 'application/json')
        // 这个地方先拿库存变化的SKU
        const result = await fetch(baseURL + '/getGoodList', {
            method: 'POST',
            body: JSON.stringify({
                mallid: currentMallId,
                cookie: goodListCookie
            }),
            headers: myHeader
        }).then(res => res.json())
        if (result.statu === 200) {
            // 先进行格式化
            if (params.type === 'download') {
                // 要导出, 就要重置下XLSXdata
                sendXLSXData = [['订单日期', 'SKU号', 'SKC号', '订单号', '日常价格', '活动价格', '活动名称', '数量']]
            }
            let format_result = result.data.map(item => ({
                    linkSkc: item.productSkcId,
                    linkSku: item.productSkuSummaries.map(sku => ({
                    itemName: sku.extCode,
                    itemSku: sku.productSkuId,
                    itemStock: sku.productSkuSemiManagedStock.skuStockQuantity,
                    itemType: sku.currencyType,
                    itemPrice: sku.siteSupplierPrices[0].supplierPrice / 100
                }))
            }))
            // 这个就是库存发生变化的
            console.log('格式化后, 开始查询库存变化', format_result)
            // 开始查询库存, 拿到我保存的数据
            let updateData = {}
            let allOrderNum = 0
            // 上一次更新的商品数据
            let previousData = JSON.parse(localStorage.getItem( currentMallId + 'currentArgCount'))
            //  循环去拿
            previousData.forEach(data => {
                // 今天产品的数据
                let link = format_result.find(item => item.linkSkc === data.linkSkc)
                data.linkSku.forEach(sku => {
                    // item拿到的是对应的sku, 然后对比sku的库存变动
                    let item = link.linkSku.find(ls => ls.itemSku === sku.itemSku)
                    if (item.itemStock < sku.itemStock) {
                        // 有变化,收起来
                        if (updateData[data.linkSkc]) {
                            updateData[data.linkSkc].push({
                                itemName: item.itemName,
                                itemdailyPrice: item.itemPrice,
                                itemCostNum: sku.itemStock - item.itemStock
                            })
                        } else {
                            updateData[data.linkSkc] = [{
                                itemName: item.itemName,
                                itemdailyPrice: item.itemPrice,
                                itemCostNum: sku.itemStock - item.itemStock
                            }]
                        }
                        allOrderNum += sku.itemStock - item.itemStock
                    }
                })
            })
            // 看看有没有变化
            console.log(updateData)
            if (Object.keys(updateData).length) {
                // 证明出单了, 去看我的活动上次的, 这个地方要存储报名的活动时间
                let prevactivityList = JSON.parse(localStorage.getItem(currentMallId + 'canUseActivity'))
                // 这次的活动
                // 去看看里面有哪些库存
                const activityList = await fetch(baseURL + '/getActivity', {
                    method: 'POST',
                    body: JSON.stringify({
                        mallid: currentMallId,
                        cookie: goodListCookie
                    }),
                    headers: myHeader
                }).then(res => res.json())
                // enrollTime 是报名时间
                // 抽取有用的,并且格式化下
                if (activityList.statu === 200) {
                    // 补零
                    function startZero(num) {
                        return num < 10 ? '0' + num : num
                    }
                    // 拿到这个月一号
                    let Times = new Date()
                    let filterTime = new Date(`${Times.getFullYear()}-${Times.getMonth() + 1}-1 00:00:00`)
                    console.log(activityList)
                    let canUseActivity = activityList.data.filter(activity => activity.assignSessionList[0]?.endTime >= filterTime).map(item => ({
                        activityName: (item.activityThematicName ? item.activityThematicName + '-' : '') + item.activityTypeName,
                        activitydstartTime: item.assignSessionList[0].startDateStr,
                        activitydendTime: item.assignSessionList[0].endDateStr,
                        activityStock: item.activityStock,
                        activitySkc: item.skcList[0].skcId,
                        activityGetTime: new Date(item.enrollTime).getFullYear() + '-' + (new Date(item.enrollTime).getMonth() + 1) + '-' + new Date(item.enrollTime).getDate() + ' ' + `${startZero(new Date(item.enrollTime).getHours())}:${startZero(new Date(item.enrollTime).getMinutes())}:${startZero(new Date(item.enrollTime).getSeconds())}`,
                        activityArgStock: item.remainingActivityStock,
                        activitySaleStock: item.activityStock - item.remainingActivityStock,
                        activityList: item.skcList.map(order => ({ itemSkc: order.skcId, child: order.skuList.map(child => ({ itemHuoHao: child.extCode, itemDelayPrice: child.sitePriceList[0].dailyPrice, itemActivePrice: child.sitePriceList[0].activityPrice, itemSku: child.skuId })) }))
                    }))
                    console.log(canUseActivity, prevactivityList)
                    let currentT = new Date().getTime()
                    canUseActivity = canUseActivity.filter(item => new Date(item.activitydstartTime).getTime() <= currentT)
                    let activityResult = {}
                    // 这个地方去拿订单列表
                    const order_url = 'https://agentseller-us.temu.com/kirogi/bg/mms/recentOrderList'
                    // 拿到所有的已发货
                    let globalOrderList =[]
                    // 拿到所有的未发货
                    let globalErrorList = []
                    // 拿到所有已签收
                    let allFinialList = []
                    let currentPage = 1
                    let currentTime = new Date()
                    let myHeader = new Headers()
                    myHeader.append('cookie', currentCookie)
                    myHeader.append('Mallid', currentMallId)
                    myHeader.append('Content-Type', 'application/json')
                    async function getData(order_url, size, data, query) {
                        const order_response = await fetch(order_url, {
                            method: 'POST',
                            headers: myHeader,
                            body: JSON.stringify(query)
                        }).then(res => res.json())
                        if (order_response.success) {
                            const { pageItems } = order_response.result
                            data.push(...pageItems)
                            // 判断,如果是就继续请求
                            let currentPageSize = currentPage * 100
                            if (order_response.result.totalItemNum > currentPageSize) {
                                await delayFn()
                                // 继续请求
                                currentPage += 1
                                query.pageNumber += 1
                                await getData(order_url, currentPage, data, query)
                            }
                        }
                    }
                    await getData(order_url, 1, globalOrderList,{
                        "fulfillmentMode": 0,
                        "pageNumber": 1,
                        "pageSize": 100,
                        "queryType": 4,
                        "sortType": 1,
                        "timeZone": "UTC+8",
                        "parentAfterSalesTag": 0,
                        "sellerNoteLabelList": [],
                        'parentOrderTimeEnd': new Date(`${currentTime.getFullYear()}-${currentTime.getMonth() + 1}-${currentTime.getDate()} 23:59:59`).getTime() / 1000,
                        'parentOrderTimeStart': new Date(`${currentTime.getFullYear()}-${currentTime.getMonth() + 1}-01 00:00:00`).getTime() / 1000
                    })
                    await getData(order_url, 1, globalErrorList, {
                        "fulfillmentMode": 0,
                        "pageNumber": 1,
                        "pageSize": 100,
                        "queryType": 2,
                        "sortType": 1,
                        "timeZone": "UTC+8",
                        "parentAfterSalesTag": 0,
                        "sellerNoteLabelList": [],
                        'parentOrderTimeEnd': new Date(`${currentTime.getFullYear()}-${currentTime.getMonth() + 1}-${currentTime.getDate()} 23:59:59`).getTime() / 1000,
                        'parentOrderTimeStart': new Date(`${currentTime.getFullYear()}-${currentTime.getMonth() + 1}-01 00:00:00`).getTime() / 1000
                    })
                    await getData(order_url, 1, allFinialList, {
                        "fulfillmentMode": 0,
                        "pageNumber": 1,
                        "pageSize": 100,
                        "queryType": 5,
                        "sortType": 3,
                        "parentOrderTimeStart": new Date(`${currentTime.getFullYear()}-${currentTime.getMonth() + 1}-01 00:00:00`).getTime() / 1000,
                        "parentOrderTimeEnd": new Date(`${currentTime.getFullYear()}-${currentTime.getMonth() + 1}-${currentTime.getDate()} 23:59:59`).getTime() / 1000,
                        "timeZone": "UTC+8",
                        "parentAfterSalesTag": 0,
                        "sellerNoteLabelList": []
                      })
                    let alreadySendNum = allOrderNum - globalErrorList.length
                    let orderList = globalOrderList.slice(0, alreadySendNum)
                    // 这个拿到orderList就是我已发货里面的数据
                    console.log('3月1号到今天的所有订单', orderList, globalErrorList, allFinialList)
                    let activitySaleList = {}
                    // 这个地方去对比哪些活动出单了的
                    canUseActivity.forEach(item => {
                        // 这个地方要对比 就是我要先根据SKC拿 然后去判断时间和名字是不是一样
                        let sameActivity = prevactivityList.find(prev => prev.activitySkc === item.activitySkc && prev.activityName === item.activityName && prev.activityGetTime === item.activityGetTime)
                        // 如果拿到了,就比对数据是不是有变化
                        if (sameActivity) {
                            let num = item.activitySaleStock - sameActivity.activitySaleStock 
                            if (num) {
                                // 证明就是大于1的,那么就打印看看
                                // 判断下我是不是这个skc就只有活动 可能有多个活动出单
                                if (!activitySaleList[item.activitySkc]) {
                                    // 如果没有就先格式化
                                    activitySaleList[item.activitySkc] = []
                                }
                                // 直接推进去
                                activitySaleList[item.activitySkc].push({
                                    activityGetTime: item.activityGetTime,
                                    activitydstartTime: item.activitydstartTime,
                                    activitydendTime: item.activitydendTime,
                                    saleNum: num,
                                    activityName: item.activityName,
                                    childList: item.activityList
                                })
                                // console.log('总共卖了多少单',num, '我的skc是什么', item.activitySkc, item)
                            }
                        } else {
                            // 新活动 看看新活动是不是有消耗
                            let num = item.activitySaleStock
                            if (num) {
                                // 证明消耗了,那么就都弄一个对象存储起来, 要判断下我是不是有多个活动
                                if (!activitySaleList[item.activitySkc]) {
                                    // 如果没有就先格式化
                                    activitySaleList[item.activitySkc] = []
                                }
                                // 直接推进去
                                activitySaleList[item.activitySkc].push({
                                    activityGetTime: item.activityGetTime,
                                    activitydstartTime: item.activitydstartTime,
                                    activitydendTime: item.activitydendTime,
                                    saleNum: item.activitySaleStock,
                                    activityName: item.activityName,
                                    childList: item.activityList
                                })
                            }
                            // console.log('我是新活动', item.activityName, '我的skc是', item.activitySkc, '这是我的所有数据', item)
                        }
                    })
                    console.log('格式化之后的所有活动出单都在这里', activitySaleList)
                    // 这个就是已经发走的
                    if (orderList.length) {
                        orderList.forEach(item => {
                            // 开始看每一单的下单事件以及对应的活动时间进行匹配
                            let order_time = item.parentOrderMap.parentConfirmTimeStr
                            // 拿到订单的时间戳
                            let order_timestramp = new Date(order_time).getTime()
                            // 拿到订单的sku
                            let order_sku = item.orderList[0].extCodeList[0]
                            // 拿到订单的skc
                            let order_skc = item.orderList[0].productInfoList[0].productSkcId
                            // 拿到订单的数量
                            let order_num = item.orderList[0].quantity
                            // 拿到这个Skc报名的活动
                            let activity_list = activitySaleList[order_skc]
                            // 拿到那个GetTime最早的,肯定是出的他的单
                            // 活动报名时间
                            let activity_active = null
                            let current_order_sku = null
                            activity_list.forEach(active_item => {
                                let start_time = new Date(active_item.activitydstartTime).getTime()
                                let end_time = new Date(active_item.activitydendTime).getTime()
                                let create_time = new Date(active_item.activityGetTime).getTime()
                                console.log(end_time, order_timestramp)
                                // 如果可售的数量不够当前的订单,直接下一个
                                if (active_item.saleNum < order_num) {
                                    // 这个活动肯定不可能出这单了
                                    return
                                }
                                // 直接看我开始的时候,是不是比我的订单生成的时间早,并且活动期间还需要比我的订单大的,是的话就先筛选出来
                                if ((start_time < order_timestramp) && !activity_active && (end_time > order_timestramp) && (create_time < order_timestramp)) {
                                    // 证明这个开始时间是在我的订单之前,那么就可以先保存来
                                    activity_active = active_item
                                    current_order_sku = active_item.childList[0].child.find(item => item.itemHuoHao === order_sku)
                                } else if (start_time < order_timestramp && (end_time > order_timestramp) && (create_time < order_timestramp)) {
                                    // 证明已经存在一个活动了,所以现在要对比
                                    // 拿到当前活动的价格
                                    let child_list = active_item.childList[0].child
                                    // 拿到当前产品的价格
                                    let current_item = child_list.find(item => item.itemHuoHao === order_sku)
                                    // 拿到上一次保存的活动价
                                    let prev_list = activity_active.childList[0].child
                                    // 拿到上一个活动的价格
                                    let prev_item = prev_list.find(item => item.itemHuoHao === order_sku)
                                    // 对比我现在的活动是不是价格比他的低,是的话就替换,不是的话就不换
                                    if (prev_item.itemActivePrice < current_item.itemActivePrice) {
                                        // 替换掉
                                        activity_active = active_item
                                        current_order_sku = active_item.childList[0].child.find(item => item.itemHuoHao === order_sku)
                                    }
                                }
                            })
                            // 到这个地方肯定会筛选出我这一单,到底是哪个活动出单,然后就记录
                            // 判断下是不是有活动, 也有的单不是活动来的
                            if (activity_active) {
                                // 有活动才走这个
                                sendXLSXData.push([order_time, order_sku, order_skc, item.parentOrderMap.parentOrderSn, current_order_sku.itemDelayPrice / 100, current_order_sku.itemActivePrice / 100, activity_active.activityName,order_num])
                                activity_active.saleNum -= order_num
                            } else {
                                // 没有活动的, 就直接录入平时的价格
                                let goodItem = format_result.find(resp => resp.linkSkc == order_skc)
                                // 拿日常价格
                                let delay_price = goodItem.linkSku.find(item => item.itemName == order_sku)
                                sendXLSXData.push([order_time, order_sku, order_skc, item.parentOrderMap.parentOrderSn, delay_price.itemPrice, null, null, order_num])
                            }
                            // 这个地方要把活动的数量减1, 下次比较的时候如果是空的,就不更换了哦
                        })
                    }
                    // 这个还没发走
                    if (globalErrorList.length) {
                        globalErrorList.forEach(item => {
                            // 开始看每一单的下单事件以及对应的活动时间进行匹配
                            let order_time = item.parentOrderMap.parentConfirmTimeStr
                            // 拿到订单的时间戳
                            let order_timestramp = new Date(order_time).getTime()
                            // 拿到订单的sku
                            let order_sku = item.orderList[0].extCodeList[0]
                            // 拿到订单的skc
                            let order_skc = item.orderList[0].productInfoList[0].productSkcId
                            // 拿到订单的数量
                            let order_num = item.orderList[0].quantity
                            // 拿到这个Skc报名的活动
                            let activity_list = activitySaleList[order_skc]
                            console.log(activity_list, activitySaleList, order_skc)
                            // 拿到那个GetTime最早的,肯定是出的他的单
                            // 活动报名时间
                            let activity_active = null
                            let current_order_sku = null
                            // 也有没报活动的
                            if (activity_list){
                                activity_list.forEach(active_item => {
                                    let start_time = new Date(active_item.activitydstartTime).getTime()
                                    let end_time = new Date(active_item.activitydendTime).getTime()
                                    let create_time = new Date(active_item.activityGetTime).getTime()
                                    console.log(end_time, order_timestramp)
                                    // 如果可售的数量不够当前的订单,直接下一个
                                    if (active_item.saleNum < order_num) {
                                        // 这个活动肯定不可能出这单了
                                        return
                                    }
                                    // 直接看我开始的时候,是不是比我的订单生成的时间早,并且活动期间还需要比我的订单大的,是的话就先筛选出来
                                    if ((start_time < order_timestramp) && !activity_active && (end_time > order_timestramp) && (create_time < order_timestramp)) {
                                        // 证明这个开始时间是在我的订单之前,那么就可以先保存来
                                        activity_active = active_item
                                        current_order_sku = active_item.childList[0].child.find(item => item.itemHuoHao === order_sku)
                                    } else if (start_time < order_timestramp && (end_time > order_timestramp) && (create_time < order_timestramp)) {
                                        // 证明已经存在一个活动了,所以现在要对比
                                        // 拿到当前活动的价格
                                        let child_list = active_item.childList[0].child
                                        // 拿到当前产品的价格
                                        let current_item = child_list.find(item => item.itemHuoHao === order_sku)
                                        // 拿到上一次保存的活动价
                                        let prev_list = activity_active.childList[0].child
                                        // 拿到上一个活动的价格
                                        let prev_item = prev_list.find(item => item.itemHuoHao === order_sku)
                                        // 对比我现在的活动是不是价格比他的低,是的话就替换,不是的话就不换
                                        if (prev_item.itemActivePrice < current_item.itemActivePrice) {
                                            // 替换掉
                                            activity_active = active_item
                                            current_order_sku = active_item.childList[0].child.find(item => item.itemHuoHao === order_sku)
                                        }
                                    }
                                })
                            }
                            // 到这个地方肯定会筛选出我这一单,到底是哪个活动出单,然后就记录
                            // 判断下是不是有活动, 也有的单不是活动来的
                            if (activity_active) {
                                // 有活动才走这个
                                sendXLSXData.push([order_time, order_sku, order_skc, item.parentOrderMap.parentOrderSn, current_order_sku.itemDelayPrice / 100, current_order_sku.itemActivePrice / 100, activity_active.activityName,order_num])
                                activity_active.saleNum -= order_num
                            } else {
                                // 没有活动的, 就直接录入平时的价格
                                let goodItem = format_result.find(resp => resp.linkSkc == order_skc)
                                // 拿日常价格
                                let delay_price = goodItem.linkSku.find(item => item.itemName == order_sku)
                                if (!order_skc) {
                                    debugger;   
                                }
                                sendXLSXData.push([order_time, order_sku, order_skc, item.parentOrderMap.parentOrderSn, delay_price.itemPrice, null, null, order_num])
                            }
                            // 这个地方要把活动的数量减1, 下次比较的时候如果是空的,就不更换了哦
                        })
                    }
                    // 已签收
                    if (allFinialList.length) {
                        allFinialList.forEach(item => {
                            // 开始看每一单的下单事件以及对应的活动时间进行匹配
                            let order_time = item.parentOrderMap.parentConfirmTimeStr
                            // 拿到订单的时间戳
                            let order_timestramp = new Date(order_time).getTime()
                            // 拿到订单的sku
                            let order_sku = item.orderList[0].extCodeList[0]
                            // 拿到订单的skc
                            let order_skc = item.orderList[0].productInfoList[0].productSkcId
                            // 拿到订单的数量
                            let order_num = item.orderList[0].quantity
                            // 拿到这个Skc报名的活动
                            let activity_list = activitySaleList[order_skc]
                            console.log(activity_list, activitySaleList, order_skc)
                            // 拿到那个GetTime最早的,肯定是出的他的单
                            // 活动报名时间
                            let activity_active = null
                            let current_order_sku = null
                            // 也有没报活动的
                            if (activity_list){
                                activity_list.forEach(active_item => {
                                    let start_time = new Date(active_item.activitydstartTime).getTime()
                                    let end_time = new Date(active_item.activitydendTime).getTime()
                                    let create_time = new Date(active_item.activityGetTime).getTime()
                                    console.log(end_time, order_timestramp)
                                    // 如果可售的数量不够当前的订单,直接下一个
                                    if (active_item.saleNum < order_num) {
                                        // 这个活动肯定不可能出这单了
                                        return
                                    }
                                    // 直接看我开始的时候,是不是比我的订单生成的时间早,并且活动期间还需要比我的订单大的,是的话就先筛选出来
                                    if ((start_time < order_timestramp) && !activity_active && (end_time > order_timestramp) && (create_time < order_timestramp)) {
                                        // 证明这个开始时间是在我的订单之前,那么就可以先保存来
                                        activity_active = active_item
                                        current_order_sku = active_item.childList[0].child.find(item => item.itemHuoHao === order_sku)
                                    } else if (start_time < order_timestramp && (end_time > order_timestramp) && (create_time < order_timestramp)) {
                                        // 证明已经存在一个活动了,所以现在要对比
                                        // 拿到当前活动的价格
                                        let child_list = active_item.childList[0].child
                                        // 拿到当前产品的价格
                                        let current_item = child_list.find(item => item.itemHuoHao === order_sku)
                                        // 拿到上一次保存的活动价
                                        let prev_list = activity_active.childList[0].child
                                        // 拿到上一个活动的价格
                                        let prev_item = prev_list.find(item => item.itemHuoHao === order_sku)
                                        // 对比我现在的活动是不是价格比他的低,是的话就替换,不是的话就不换
                                        if (prev_item.itemActivePrice < current_item.itemActivePrice) {
                                            // 替换掉
                                            activity_active = active_item
                                            current_order_sku = active_item.childList[0].child.find(item => item.itemHuoHao === order_sku)
                                        }
                                    }
                                })
                            }
                            // 到这个地方肯定会筛选出我这一单,到底是哪个活动出单,然后就记录
                            // 判断下是不是有活动, 也有的单不是活动来的
                            if (activity_active) {
                                // 有活动才走这个
                                sendXLSXData.push([order_time, order_sku, order_skc, item.parentOrderMap.parentOrderSn, current_order_sku.itemDelayPrice / 100, current_order_sku.itemActivePrice / 100, activity_active.activityName,order_num])
                                activity_active.saleNum -= order_num
                            } else {
                                // 没有活动的, 就直接录入平时的价格
                                let goodItem = format_result.find(resp => resp.linkSkc == order_skc)
                                // 拿日常价格
                                let delay_price = goodItem.linkSku.find(item => item.itemName == order_sku)
                                if (!order_skc) {
                                    debugger;   
                                }
                                sendXLSXData.push([order_time, order_sku, order_skc, item.parentOrderMap.parentOrderSn, delay_price.itemPrice, null, null, order_num])
                            }
                            // 这个地方要把活动的数量减1, 下次比较的时候如果是空的,就不更换了哦
                        })
                    }
                    console.log(sendXLSXData)
                    if (params.type === 'download') {
                        // 导出
                        // 将二进制的数据转成excel专用
                        const ws = XLSX.utils.aoa_to_sheet(sendXLSXData)
                        // 将数据写入到表中
                        // 创建一个工作簿
                        const wb = XLSX.utils.book_new()
                        XLSX.utils.book_append_sheet(wb, ws, '订单列表')
                        const currentTime = new Date()
                        XLSX.writeFile(wb, `demo/半托订单信息表.xlsx`)
                    }
                }
            }
        }
    } else if (params.message == 'getSendOrderData') {
        // 这个地方我们重新发一次请求,拿到数据
        const myHeader = new Headers()
        myHeader.append('Content-Type', 'application/json')
        myHeader.append('Mallid', currentMallId)
        myHeader.append('Cookie', currentCookie)
        const result = await fetch('https://agentseller-us.temu.com/mms/eagle/package/online/query_sku_history_package',{
            method: 'POST',
            headers: myHeader,
            body: sendOrderData
        }).then(res => res.json())
        console.log(result, '我的二次请求哦')   
        if (result.success) {
            //发给页面之前,先去本地拿数据吧 哎
            let findData = result.result.sku_history_packages[0].package_sku_info_list.map(item => item.product_sku_id)
            const localResult = await fetch(baseURL + '/getGoodSize', {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json'
                },
                body: JSON.stringify({
                    data: findData,
                    mallid: currentMallId,
                    cookie: goodListCookie
                })
            }).then(res => res.json())
            // 格式化数据之后发给前台
            if (localResult.statu === 200) {
                let sendData = []
                localResult.data.map((item, index) => {
                    let finder = item.productSkuSummaries.find(prod => prod.productSkuId === findData[index])
                    sendData.push({
                        itemSku: finder.productSkuId,
                        itemHuoHao: finder.extCode,
                        property: finder.productSkuWhExtAttr.productSkuVolume,
                        itemWeight: finder.productSkuWhExtAttr.productSkuWeight
                    })
                })
                MessageToWindow(currentActiveId, 'getWeight', {
                    goodNums: sendData
                })
            }
        }
    } else if (params.message == 'getWarehouseOder') {
        const url = 'https://agentseller-us.temu.com/mms/eagle/package/main_batch_query'
        const myHeader = new Headers()
        myHeader.set('mallid', currentMallId)
        myHeader.set('cookie', currentCookie)
        myHeader.set('Content-Type', 'application/json')
        const response = await fetch(url, {
            method: 'POST',
            headers: myHeader,
            body: JSON.stringify({
                "page_number": 1,
                "page_size": 200,
                "sort_type": 1,
                "call_begin_time": 1735660800,
                "call_end_time": 1738339199
            })
        }).then(res => res.json())
        // 拿下产品信息
        const result = await fetch(baseURL + '/getGoodList', {
            method: 'POST',
            body: JSON.stringify({
                mallid: currentMallId,
                cookie: goodListCookie
            }),
            headers: myHeader
        }).then(res => res.json())
        if (response.success) {
            // 生成excel,包含订单号和货号
            let Data = [['订单创建时间', '订单号', '数量', 'spu', '货号', '运单号', '物流公司', '预计运费', '单位']]
            let status = result.statu
            response.result.package_info_result_list.forEach(item => {
                let HuoHao = null, goodName = null
                if (status === 200) {
                    HuoHao = result.data.find(resp => resp.productSkuSummaries.find(sku => {
                        if (sku.productSkuId === item.order_send_info_list[0].product_sku_id) {
                            goodName = sku.extCode
                            return true
                        }
                    }))
                }
                Data.push([item.label_call_time_str, item.order_send_info_list[0].parent_order_sn, item.order_send_info_list[0].quantity, item.order_send_info_list[0].product_spu_id, goodName, item.tracking_number, item.shipping_company_name, item.online_estimated_vo.estimated_amount, item.online_estimated_vo.estimated_currency_code])
            })
            // 创建表 输出
            const wb = XLSX.utils.book_new()
            // 创建数据
            const ws = XLSX.utils.aoa_to_sheet(Data)
            // 写入
            XLSX.utils.book_append_sheet(wb, ws, '快递面单')
            // 导出
            XLSX.writeFile(wb, './半托面单.xlsx')
        }
    } else if (params.message == 'download_aliexpress_order') {
        // 要多加一行
        let xlsxData = JSON.parse(params.data)
        xlsxData.unshift([
            'Order NO',
            'SKU',
            'SKU Qty',
            'Tag',
            'Request Ship Date',
            'Recipient Name',
            'Recipient Company',
            'Recipient Address Line 1',
            'Recipient Address Line 2',
            'Recipient State',
            'Recipient City',
            'Recipient ZipCode',
            'Recipient Country',
            'Recipient Phone',
            'Recipient Email',
            'Request Shipping Service',
            'Warehouse Customized Service Name',
            'Signature Option',
            'Tracking Number',
            'Shipping Carrier',
            'Insurance',
            'Cod',
            'Notes'
        ])
        const wb = XLSX.utils.book_new()
        // 生成excel对应的数据
        const ws = XLSX.utils.aoa_to_sheet(xlsxData)
        // 添加进去
        XLSX.utils.book_append_sheet(wb, ws, '速卖通批量发货订单')
        // 导出
        XLSX.writeFile(wb, './发货订单/速卖通发货单.xlsx')
    } else if (params.message == 'getOrderBySn') {
        const allList = params.data
        console.log(allList, allList.length)
        // 现在要根据传递过来的cookie和mallid去查询订单了
        const myHeader = new Headers()
        myHeader.append('cookie', currentCookie)
        myHeader.append('mallid', currentMallId)
        myHeader.append('content-type', 'application/json')
        // 所有符合的订单存储起来
        let allGoodOrder = []
        async function getOrderBySn(list) {
            // 拿上个月的回款 那么就是1月1号到3月1号的订单 里面就包含了所有的回款订单
            const result = await fetch('https://agentseller-us.temu.com/kirogi/bg/mms/recentOrderList', {
                method: 'post',
                headers: myHeader,
                body: JSON.stringify({
                    "fulfillmentMode": 0,
                    "pageNumber": 1,
                    "pageSize": 100,
                    "queryType": 5,
                    "sortType": 3,
                    "parentOrderSnList": list,
                    "timeZone": "UTC+8",
                    "parentAfterSalesTag": 0,
                    "sellerNoteLabelList": []
                  })
            }).then(res => res.json())
            allGoodOrder.push(...result.result.pageItems.map(item => ({
                '订单号': item.parentOrderMap.parentOrderSn,
                '订单创建时间': item.parentOrderMap.parentConfirmTimeStr,
                '产品货号': item.orderList[0].extCodeList[0]
            })))
        }
        // 一次只能拿100条,先拿一百条看看效果
        let allCount = Math.ceil(allList.length / 100)
        for (let index = 0; index < allCount; index++) {
            await getOrderBySn(allList.slice(index * 100, (index + 1) * 100).map(item => item.orderId))
        }
        // 这个地方再匹配下收入
        let downFileList = [['订单号', '订单创建时间', '产品货号', '产品回款']]
        console.log(allGoodOrder)
        allGoodOrder.forEach(item => {
            let order = allList.find(list => list.orderId == item['订单号'])
            if (order) {
                // 添加数据
                downFileList.push([order.orderId, item['订单创建时间'], item['产品货号'], order.orderPrice])
            }
        })
        console.log(downFileList)
        // 导出
        const wb = XLSX.utils.book_new()
        // 读取
        const ws = XLSX.utils.aoa_to_sheet(downFileList)
        // 写入
        XLSX.utils.book_append_sheet(wb, ws, '回款数据表')
        // 导出
        XLSX.writeFile(wb, '回款数据对照表/data_diff_sheet.xlsx')
    }
})

// 下载亚马逊视频的函数
async function downloadAmazonVideo(list) {
    // 下载看看能拿到什么
    let bufferLen = 0
    let allBatter = []
    for (let index = 0; index < list.length; index++) {
        const buffers = await fetch(list[index]).then(res => res.arrayBuffer())
        bufferLen += buffers.byteLength
        // 拿到里面的内容,然后合并给我
        const batterData = new Uint8Array(buffers)
        allBatter.push(batterData)
    }
    if (allBatter.length) {
        // 存储文件名称
        const inputFiles = []
        allBatter.forEach((buffer, index) => {
            const fileName = `file${index}.ts`
            ffmpeg.FS('writeFile', fileName, buffer)
            inputFiles.push(`file '${fileName}'`)
        })
        // 再写一个文本
        ffmpeg.FS('writeFile', 'filelist.txt', inputFiles.join('\n'))
        // 合并ts文件
        await ffmpeg.run('-f', 'concat', '-safe', '0', '-i', 'filelist.txt', '-c', 'copy', 'demo.ts')
        // 读取文件
        const data = ffmpeg.FS('readFile', 'demo.ts')
        const url = URL.createObjectURL(new Blob([data.buffer], { type: 'video/MP4' }));
        chrome.downloads.download({
            url,
            saveAs: false,
            filename: `amazon/${String(new Date().getTime()).slice(3, 7)}.mp4`,
            conflictAction: 'uniquify'
        })
        // const a = document.createElement('a');
        // a.style.display = 'none';
        // a.href = url;
        // const dateEl = new Date()
        // a.download = `amazon_video-${dateEl.getFullYear()}/${(dateEl.getMonth()+1)}/${dateEl.getDate()}.mp4`;
        // document.body.appendChild(a);
        // a.click();
        // 进来就先清理掉
        ffmpeg.FS('unlink', 'filelist.txt');
        // 继续下载
        // 判断我当前的list,看看是不是要继续调用
        if (amazonVideoList.length) {
            await downloadAmazonVideo(amazonVideoList.pop())
        }
    }
}


// 文字转码
function ChineseToCode(font) {
    return encodeURIComponent(font)
}

// 这个地方就是去登录
async function LoginByPhone(options) {
    return await fetch(options.url, options.data).then(res => res.json())
}

async function getAllStock(params, stockInfo, getPaiPaiStock, getHouseUrl) {
    let errorList = []
    // 如果有,那就要循环去拿到每一个账号对应的库存那些数据,然后给contentjs在前台显示
    for (let index = 0; index < params.data.length; index++) {
        // 这个地方要判断一下,如果是邱总的号就要单独的处理了
        if (/^szt.+(?=@126.com)/.test(params.data[index].phone)) {
            // 请求仓库对应的数据地址 ==> https://oms.shipout.com/api/wms-user/user/afterLogin?orgType=1
            getHouseUrl = 'https://oms.shipout.com/api/wms-user/user/afterLogin?orgType=1'
            const PaiPaiHouse = await LoginByPhone({
                url: getHouseUrl,
                data: {
                    headers: {
                        'Authorization': `Bearer ${params.data[index].token}`
                    }
                }
            })
            if (PaiPaiHouse.result === 'OK') {
                // 证明有数据,那么格式化之后直接丢到我的全局里面去
                PaiPaiWareHouse = PaiPaiHouse.data.warehouseList.map(warehouse => ({
                    warehouseId: warehouse.warehouseId,
                    warehouseName: warehouse.warehouseName
                }))
                // 接下去就要去拿库存数据了,这个又是单独的请求路径
                getPaiPaiStock = 'https://oms.shipout.com/api/shipout-stock2/oms/stock/querySkuStockBySku'
                const PaiPaiStock = await LoginByPhone({
                    url: getPaiPaiStock,
                    data: {
                        headers: {
                            'Authorization': `Bearer ${params.data[index].token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            "queryType": "OnlyInStock",
                            "sourceType": "Inbound",
                            "curPageNo": 1,
                            "pageSize": 60
                        }),
                        method: 'post'
                    }
                })
                if (PaiPaiStock.result === 'OK') {
                    // 直接推到一块去先，看看拿到什么数据
                    let { records } = PaiPaiStock.data
                    // 拿到结构的所有数据,我们直接弄一个数组存起来
                    // 在这里就要格式化了已经 笑死
                    records = records.map(item => {
                        // 再循环一下里面的四个仓进行替换
                        for (let index = 0; index < item.warehouseStockList.length; index++) {
                            const PaiPaiStockItem = item.warehouseStockList[index]
                            // 找到对应的仓库名称
                            const warehouseItem = PaiPaiWareHouse.find(warehouse => warehouse.warehouseId === PaiPaiStockItem.warehouseId)
                            // 然后拿到对应的名称添加进去
                            PaiPaiStockItem.warehouseName = warehouseItem.warehouseName
                        }
                        return {
                            ItemName: item.sku.skuNameEN.replace(/@/, ''),
                            ItemSku: item.sku.omsSku.replace(/@/, ''),
                            ItemStock: item.qty.standardQty, //实际库存
                            subItemList: item.warehouseStockList.map(warehouse => ({
                                warehouseName: warehouse.warehouseName,
                                omsAvailableQuantity: warehouse.qty.standardQty
                            }))
                        }
                    })
                    stockAllInfo.push(...records)
                } else {
                    console.log('这个有毛病')
                }
                // 直接下一个 continue
                continue
            }
        } else {
            // 地址,基本是固定的，我们直接点击300条一次就行了
            const url = 'https://oms.shipout.com/api/wms-business/oms/stock/list?showSkuType=1&pageSize=300&curPageNo=1'
            stockInfo = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${params.data[index].token}`
                }
            }).then(res => res.json())
        }
        console.log('这是请求到的数据', stockInfo)
        if (stockInfo.result === 'OK') {
            // 证明请求到数据了,这个时候我们就可以拿到当前我的所有SKU以及所对应的可用数量
            const { records } = stockInfo.data
            // 拿到结构的所有数据,我们直接弄一个数组存起来
            stockAllInfo.push(...records.map(item => ({
                ItemName: item.skuNameEN.replace(/@/, ''),
                ItemSku: item.omsSku.replace(/@/, ''),
                ItemStock: item.omsAvailableQuantity, //实际库存
                subItemList: item.subItemList.map(item => ({
                    warehouseName: item.warehouseName,
                    omsAvailableQuantity: item.omsAvailableQuantity
                }))
            })))
        } else {
            // 证明没拿到数据,这个时候要console下 一般是不会出现这种情况的
            console.log("账号" + params.data[index].phone + '出问题,没有拿到数据')
            // 这个地方其实就是token过期了,重新登陆一次并且,保存之后再调用这个函数就行了,所以
            // 那么就是没请求到,证明token有毛病,就得收集起来
            errorList.push({
                phone: params.data[index].phone,
                pwd: params.data[index].pwd
            })
        }
        // 强制等待一秒
        await delayFn()
    }
    return errorList
}

// 这个是先登录成功,然后去拿数据
async function getTokenByPhone(options, flag) {
    let { url, phone, pwd } = options
    let globalToken;
    // 设置一个数组来存放数据
    if (flag) {
        // 这个是重新登陆就行,不用重新添加
        for (let index = 0; index < 1; index++) {
            // 发送的数据是formdata
            const sendData = new FormData()
            sendData.append('grant_type', 'password')
            sendData.append('username', phone)
            sendData.append('password', pwd)
            sendData.append('scope', 'oms')
            sendData.append('systemType', 'OMS')
            sendData.append('client_secret', 7700)
            sendData.append('client_id', "browser-oms")
            //发请求
            const result = await fetch(url, {
                method: 'post',
                body: sendData,
            }).then(res => res.json())
            if (result.userId?.length) {
                // 我已经拿到了,可以更新你的local了
                setTimeout(() => {
                    // 发送给popup
                    MessageToPopup("addSuccess", {
                        phone,
                        pwd,
                        token: result.access_token
                    })
                });
                globalToken = result.access_token
            } else {
                // 没有拿到就报错
                console.log('第二次拿数据拿不到数据,请检查代码逻辑是否出错')
            }
        }
        console.log('自动更新账号数据成功')
    } else {
        // 获取cookies
        chrome.cookies.getAll({ url: 'https://oms.shipout.com' }, async (cookie) => {
            // 搞了那么久，原来这玩意不用Cookie就可以拿到token
            // console.log('cookie', cookie)
            // 要整一个Cookies 试试看是不是Cookie是固定的,我假设下
            // let Cookies = cookie.map(item => `${item.name}=${item.value}`)
            // 加一个
            // Cookies.push('__hssrc=1')
            // 全部合成
            // Cookies = Cookies.join(';')

            // 设置一个请求头
            const myHeaders = new Headers();
            // 设置类型
            // 发送的数据是formdata
            const sendData = new FormData()
            sendData.append('grant_type', 'password')
            sendData.append('username', phone)
            sendData.append('password', pwd)
            sendData.append('scope', 'oms')
            sendData.append('systemType', 'OMS')
            sendData.append('client_secret', 7700)
            sendData.append('client_id', "browser-oms")
            //发请求
            const result = await fetch(url, {
                method: 'post',
                body: sendData,
                headers: myHeaders,
                credentials: 'include'
            }).then(res => res.json())
            console.log('验证token', result)
            // 判断是不是拿到了token
            if (result.userId?.length) {
                // 并且告诉父亲说,我已经拿到了,可以更新你的local了
                setTimeout(() => {
                    // 发送给content
                    MessageToWindow(currentActiveId, 'addAccount', {
                        statu: 200,
                        msg: "添加成功,账号为" + result.userName,
                        phone,
                        pwd
                    })
                    // 发送给popup
                    MessageToPopup("addSuccess", {
                        phone,
                        pwd,
                        token: result.access_token
                    })
                });
                globalToken = result.access_token
            } else {
                setTimeout(() => {
                    MessageToWindow(currentActiveId, 'addAccount', {
                        statu: 201,
                        msg: "添加失败,账号为" + phone
                    })
                    MessageToPopup("addFail", {
                        phone
                    })
                });
            }
        })
        console.log('添加账号成功')
    }
    return globalToken
}


// 给特定的window的id发指定的消息
function MessageToWindow(id, msg, data) {
    chrome.tabs.sendMessage(id, {
        type: msg,
        data
    })
}

function MessageToPopup(msg, data) {
    chrome.extension.sendMessage({
        message: msg,
        data
    })
}

async function exchangeRate(data) {
    let url = 'https://sp0.baidu.com/5LMDcjW6BwF3otqbppnN2DJv/finance.pae.baidu.com/vapi/async/v1?'
    // from_money=%E7%BE%8E%E5%85%83&to_money=%E4%BA%BA%E6%B0%91%E5%B8%81&from_money_num=1&srcid=5293&sid=60277_61027_60853_61362_61679_61734_61780_61822_61844_61777_61804_61879_61986&cb=jsonp_1737599045478_60405
    for (const key in data) {
        url += `${key}=${data[key]}&`
    }
    url = url.toString(0, url.length - 1)
    const { Result } = await fetch(url).then(res => res.json())
    const allData = Result[1]
    // 拿到对应的转化名称
    const Title = allData.Title
    // 拿到对应的汇率
    // Result[1].DisplayData.resultData.tplData.result.cur
    const price = allData.DisplayData.resultData.tplData.result.cur.num
    return {
        Title,
        price
    }
}

/**
 * 强制等待
 * @param {number} timeout 延迟毫秒数
 */
async function delayFn(timeout = 1000) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve()
        }, timeout);
    })
}