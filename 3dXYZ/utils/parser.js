/**
 * 解析從 Projectron 匯出的自訂數據格式。
 * @param {string} stringData - 從檔案讀取的原始字串內容。
 * @returns {{vertices: number[][], colors: number[][]}} 一個包含純數字陣列的物件，格式為 [[x,y,z], ...] 和 [[r,g,b,a], ...]。
 */
function parseProjectronData(stringData) {
  // 數據由 ',\n' 分隔成頂點和顏色兩部分
  const parts = stringData.split(',\n');

  // --- 解析頂點位置 ---
  // 移除 'vert-xyz,' 前綴並按逗號分割
  const vertStrings = parts[0].replace('vert-xyz,', '').split(',');
  const vertices = [];
  // 每 3 個值組成一個頂點 [x, y, z]
  for (let i = 0; i < vertStrings.length; i += 3) {
    const x = parseFloat(vertStrings[i]);
    const y = parseFloat(vertStrings[i + 1]);
    const z = parseFloat(vertStrings[i + 2]);
    // 直接儲存為純數字陣列
    vertices.push([x, y, z]);
  }

  // --- 解析頂點顏色 ---
  // 移除 'col-rgba,' 前綴並按逗號分割
  const colorStrings = parts[1].replace('col-rgba,', '').split(',');
  const colors = [];
  
  // 每 4 個值組成一個顏色 [r, g, b, a]
  for (let i = 0; i < colorStrings.length; i += 4) {
    // Projectron 的顏色值範圍是 0-1，直接儲存這些原始值
    const r = parseFloat(colorStrings[i]);
    const g = parseFloat(colorStrings[i + 1]);
    const b = parseFloat(colorStrings[i + 2]);
    const a = parseFloat(colorStrings[i + 3]);
    // 直接儲存為純數字陣列
    colors.push([r, g, b, a]);
  }

  // 返回一個包含純陣列的結構化物件
  return { vertices, colors };
}