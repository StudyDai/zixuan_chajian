<template>
  <div class="main_app">
    <h1>今天日期: 2025年3月19号</h1>
    <h2>监听数据展示表</h2>
    <div id="mapEl" ref="mapRef"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts';
export default {
  name: 'app',
  data() {
    return {
      option: {
        xAxis: {
          type: 'category',
          data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            data: [150, 230, 224, 218, 135, 147, 260],
            type: 'line'
          }
        ]
      }
    }
  },
  created() {
    console.log(localStorage.getItem(''))
  },
  mounted() {
    console.log(this.$refs)
    var myChart = echarts.init(this.$refs.mapRef, null, {
      width: 800,
      height: 400
    });
    myChart.setOption(this.option)
  }
}
</script>

<style scoped>
.main_app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
#mapEl {
  width: 100%;
  height: 600px;
  display: flex;
  justify-content: center;
}
</style>
