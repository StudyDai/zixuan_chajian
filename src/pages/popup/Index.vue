<template>
  <div id="app">
    <div v-if="!hasPermission">
      <label>
          <span>请输入激活码</span>
          <input type="text" id="code" v-model="code">
      </label>
      <label>
        <span>请输入破解参数</span>
        <input type="text" id="param" v-model="param">
      </label>
      <button id="vertifyCode" @click="vertify">验证</button>
      <div v-if="cannotUse">
              <h1>您暂无权限使用,请联系管理员开通权限</h1>
      </div>
    </div>
    <div v-if="hasPermission">
      <div class="getMoney">
        <button @click="getAllGoodAndActivity" :disabled="CanClick">开启记录</button>
        <button @click="getCurrentActivity">更新记录</button>
        <button @click="getCurrentActivity('download')">导出记录</button>
        <button @click="getCurrentOrder">获取当月面单</button>
        <button @click="getOrderByAccount">根据回款匹配订单</button>
        <input type="file" style="visibility: hidden;" ref="fileIpt"  />
      </div>
      <div class="get_good_excel">
          <button @click="getRate" class="excel-button">获取商品售后率表格</button>
          <div class="date-inputs">
              <input v-model="start_time" type="date" placeholder="请输入开始时间" class="date-field">
              <input v-model="end_time" type="date" placeholder="请输入结束时间" class="date-field">
          </div>
      </div>
      <div class="stock_info">
          <button @click="goToLargePage" class="action-button">跳转新页面显示库存</button>
          <button @click="getData" class="action-button">当前页面显示库存</button>
          <button @click="showDialog = true" class="action-button">添加新账号</button>
          <button @click="delAccount" class="action-button danger-button">删除现有账号</button>
      </div>
      <div class="mian_table">
          <button @click="inputOrder" class="export-button">批量导出派派面单</button>
          <button @click="inputOrder('shipout')" class="export-button blue">批量导出维赢(shipout)面单</button>
          <input id="order_ipt" type="text" v-model="downloadList" placeholder="请输入以逗号或者空格分隔的订单号" class="order-input"/>
      </div>
      <table>
        <tr v-for="item in abroadStock" :key="item.phone">
          <td>{{ item.phone }}</td>
          <td>{{ item.pwd }}</td>
          <td>{{ item.statu }}</td>
        </tr>
      </table>
      <form v-if="showDialog">
        <label for="phone">手机号:</label>
        <input type="text" id="phone" v-model="formData.phone">
        <label for="pwd">密码:</label>
        <input type="password" id="pwd" v-model="formData.pwd">
        <button @click="addAccount">添加</button>
      </form>
    </div>
  </div>
</template>

<script>
import HelloWorld from '@/components/HelloWorld.vue'
export default {
  name: 'App',
  components: {
    HelloWorld
  },
  data() {
    return {
      abroadStock: [], // 国外库存数据
      showDialog: false,
      formData: {
        phone: '',
        pwd: ''
      },
      CanClick: localStorage.getItem('keepOpen') ? true : false,
      downloadList: '',
      hasPermission: localStorage.getItem('pmn') ?? false,
      cannotUse: false,
      code: '',
      param: '',
      start_time: '',
      end_time: ''
    }
  },
  created() {
    document.addEventListener('contextmenu',(event) => {
        // event.preventDefault();
    })
    chrome.runtime.onMessage.addListener((resp, sender, sendResponse) => {
      if(resp.message == 'addFail') {
        // 添加失败,那么就打印说错了,不进行操作
      } else if (resp.message == 'addSuccess') {
        // 添加成功,更新我的数组,然后打印出来
        const Item = this.abroadStock.find(item => item.phone === resp.data.phone)
        if(!Item) {
          this.abroadStock.push({
            phone: resp.data.phone,
            pwd: resp.data.pwd,
            statu: '正常',
            token: resp.data.token
          })
        } else {
          // 如果存在就更新token
          Item.token = resp.data.token
        }
        localStorage.setItem('accountList', JSON.stringify(this.abroadStock))

      } else if (resp.message == 'ThisStock') {
        console.log(resp.data,'这是在当前页面显示的数据')
      } else if (resp.message == 'vertifyResult') {
        // 如果验证通过了,就弹窗,让他再输入第二轮
        if (resp.data.statu) {
          alert('验证通过,请输入管理员发的密钥,无需账号')
        } else {
          alert('验证失败,请重新找管理员获取')
        }
        this.code = ''
        this.param = ''
      } else if (resp.message == 'loginResult') {
        if (resp.data.statu) {
          // 登录成功啦
          this.hasPermission = true
          localStorage.setItem('pmn', true)
          localStorage.setItem('vertify', true)
        } else {
          alert('密钥有误, 请重新输入')
        }
      }
    })
    const list = localStorage.getItem('accountList')
    if (list) {
      this.abroadStock = JSON.parse(list)
    }
  },
  mounted() {
    let baseURL = 'http://192.168.188.47:8889'
    this.$refs.fileIpt.addEventListener('change', async (event) => {
      console.log('文件上传了,看看', event.target.files)
      let formData = new FormData()
      let cookie = localStorage.getItem('normalCookie')
      let mallid = localStorage.getItem('mallid')
      formData.append('file', event.target.files[0])
      const result = await fetch(baseURL + '/getOrderByAccount?cookie=' + cookie + '&mallid=' + mallid , {
          method: 'post',
          body: formData
      }).then(res => res.json())
      // 查看返回之后的数据
      console.log('这是返回的数据', result)
      if (result.statu === 200) {
        chrome.runtime.sendMessage({
          message: 'getOrderBySn',
          data: result.data
        })
      }
    })
    // 感觉这个地方直接算
    const times = localStorage.getItem('times') ?? 0
    // 当前时间
    const now = new Date().getTime()
    console.log(`还剩余有效期:%c${(times - now )/1000 / 60 / 60 /24/7}周`,'color: red; font-size: 18px; font-weight: 700')
    if (times - now <= 0) {
      this.hasPermission = false
      localStorage.setItem('vertify', false)
      localStorage.setItem('pmn', false)
    }
  },
  methods: {
    getCurrentOrder() {
      chrome.runtime.sendMessage({
        message: 'getWarehouseOder'
      })
    }, 
    getOrderByAccount() {
      // 要选择一个excel文件
      this.$refs.fileIpt.click()     
    },
    getAllGoodAndActivity() {
      localStorage.setItem('keepOpen', true)
      this.CanClick = true
      // 直接发请求给background
      chrome.runtime.sendMessage({
        message: 'getAllGoodAndActivity'
      })
    },
    getCurrentActivity(value) {
      chrome.runtime.sendMessage({
        message: 'getCurrentActivity',
        type: value
      })
    },
    getRate() {
      let dateEl = new Date()
      let years = dateEl.getFullYear()
      let months = dateEl.getMonth() + 1
      let days = dateEl.getDate()
      let start, end;
      if (this.start_time.trim() && this.end_time.trim()) {
        start = this.start_time
        end = this.end_time
      } else if (this.start_time.trim()) {
        start = this.start_time
        end = `${years}-${months < 10 ? '0' + months : months}-${days < 10 ? '0' + days : days}`
      } else {
        start = `${years}-${months < 10 ? '0' + months : months}-01`
        end = `${years}-${(months) < 10? '0' + months : months}-${days < 10? '0' + days : days}`
      }
      chrome.runtime.sendMessage({
        message: 'getGoodRate',
        data: {
          startTime: start,
          endTime: end
        }
      })
    },
    vertify() {
        if (this.code.trim() && this.param.trim()) {
          // 这个地方直接就可以验了
          chrome.runtime.sendMessage({
            message: 'checkCode',
            data: {
              code: this.code,
              param: this.param
            }
          })
        } else if (this.param.trim()) {
          // 这个地方直接就可以验了
          chrome.runtime.sendMessage({
            message: 'loginCode',
            data: {
              param: this.param
            }
          })
        }
    },
    inputOrder(value) {
      console.log(this.downloadList)
        if(this.downloadList.trim()) {
          //  我输入了,这个时候去进行转化成数组,然后告诉background
          chrome.runtime.sendMessage({
            message: 'downloadFile',
            data: this.downloadList.split(/[\s,]+/),
            type: value
          })
        }
    },
    goToLargePage () {
      const UrlPath = chrome.runtime.getURL('/options.html')
      // 跳转
      chrome.tabs.create({ url: UrlPath })
    },
    // 在当前页面显示去获取数据
    getData() {
      // 跟我的background沟通下
      chrome.runtime.sendMessage({
        message: 'getStockInThis',
        data: this.abroadStock
      })
    },
    addAccount() {
      // 让background去登录看看是不是真的
      chrome.runtime.sendMessage({
        message: 'login',
        data: this.formData
      })
    },
    delAccount() {},
  }
}
</script>

<style>
body::-webkit-scrollbar {
  display: none;
}
.blue {
  background-color: rgba(10, 217, 245, 0.842) !important;
}
#app {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 300px;
  flex-direction: column;
}
table {
  /* 设置表格的单元格格式，这个collapse是设置他边框线合并，默认是分开的 */
  border-collapse: collapse;
  /* 然后设置一下单元格间距 */
  border-spacing: 0;
  margin-top: 15px;
}
table td {
  border: 1px solid #ccc;
  padding: 10px;
}
button {
  margin: 10px 0;
}
/* 整体容器样式 */
.get_good_excel {
    display: flex;
    flex-direction: column;
    max-width: 300px;
    margin: auto;
    padding: 10px;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    background-color: #f9f9f9;
}

/* 按钮样式 */
.excel-button {
    background-color: #007bff; /* 蓝色背景 */
    color: white;
    border: none;
    padding: 5px;
    font-size: 14px;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.excel-button:hover {
    background-color: #0056b3; /* 更深的蓝色背景 */
}

/* 输入框容器样式 */
.date-inputs {
    margin-top: 15px;
    display: flex;
    justify-content: space-between;
}

/* 输入框样式 */
.date-field {
    flex: 1;
    margin: 0 5px;
    padding: 8px;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 5px;
    transition: border-color 0.3s ease;
}

.date-field:focus {
    border-color: #007bff; /* 当聚焦时边框变蓝 */
    outline: none;
}

/* 整体容器样式 */
.stock_info {
    display: flex;
    flex-direction: column;
    gap: 10px; /* 按钮之间的间距 */
    max-width: 300px;
    margin: auto;
    padding: 10px;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    background-color: #f9f9f9;
}

/* 按钮基础样式 */
.action-button {
    background-color: #007bff; /* 蓝色背景 */
    color: white;
    border: none;
    padding: 5px;
    font-size: 14px;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    text-align: center;
}

/* 鼠标悬停时的效果 */
.action-button:hover {
    background-color: #0056b3; /* 更深的蓝色背景 */
}

/* 删除按钮特殊样式 */
.danger-button {
    background-color: #dc3545; /* 红色背景 */
}

.danger-button:hover {
    background-color: #c82333; /* 更深的红色背景 */
}


/* 整体容器样式 */
.mian_table {
    display: flex;
    flex-direction: column;
    gap: 10px; /* 控制按钮和输入框之间的间距 */
    max-width: 300px;
    margin: auto;
    padding: 10px;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    background-color: #f9f9f9;
}

/* 按钮基础样式 */
.export-button {
    background-color: #28a745; /* 绿色背景 */
    color: white;
    border: none;
    padding: 5px;
    font-size: 14px;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    text-align: center;
}

/* 鼠标悬停时的效果 */
.export-button:hover {
    background-color: #218838; /* 更深的绿色背景 */
}

/* 输入框样式 */
.order-input {
    padding: 8px;
    font-size: 14px;
    border: 1px solid #ccc;
    border-radius: 5px;
    transition: border-color 0.3s ease;
}

/* 输入框聚焦时的效果 */
.order-input:focus {
    border-color: #80bdff; /* 边框变蓝 */
    outline: none;
    box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25); /* 蓝色阴影 */
}
</style>
