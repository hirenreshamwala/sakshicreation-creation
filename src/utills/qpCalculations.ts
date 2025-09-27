// Deckal Calculation = width + height

export const calculateDeckal = (width: number, height: number): number => {
  if (!width || !height) return 0
  return width + height
}


// GSM Calculation based on Ply
// length + (width+(width/2)) + height => for 3 ply
// length + (width+(width/2)) + length + (width+(width/2)) + height => for 5 ply
// length + (width+(width/2)) + length + (width+(width/2)) + length + (width+(width/2)) + height => for 7 ply

export const calculateGSM = (
  ply: number,
  length: number,
  width: number,
  height: number
): number => {
  if (!ply || !length || !width || !height) return 0

  let total = 0
  const widthHalf = width / 2

  // loop: till ply-1 (last always height)
  for (let i = 1; i < ply; i++) {
    if (i % 2 !== 0) {
      // odd index -> length
      total += length
    } else {
      // even index -> width + width/2
      total += width + widthHalf
    }
  }

  // last ply always height
  total += height

  return total
}

// KG per Piece
// abc=(length + width + 2)*2 
// kgperpeice = abc * deckal * gsm /1550 / 1000

export const calculateKgPerPiece = (
  length: number,
  width: number,
  deckal: number,
  gsm: number
): number => {
  if (!length || !width || !deckal || !gsm) return 0

  const abc = (length + width + 2) * 2
  return (abc * deckal * gsm) / 1550 / 1000
}

// Total KG
// totalkg = noofpieces * kgperpeice

export const calculateTotalKg = (
  noOfPieces: number,
  kgPerPiece: number
): number => {
  if (!noOfPieces || !kgPerPiece) return 0
  return noOfPieces * kgPerPiece
}

// Total Amount
// totalamount = noofpieces * rateperpiece

export const calculateTotalAmount = (
  noOfPieces: number,
  ratePerPiece: number
): number => {
  if (!noOfPieces || !ratePerPiece) return 0
  return noOfPieces * ratePerPiece
}

// Kantan Calculation
// kantanperunit = length * width + 3 * 2
// totalkantaninch = noofpieces * kantanperunit
// reel = Math.floor(totalkantaninch / 7200)
// inch = totalkantaninch % 7200



export const calculateKantan = (
  length: number,
  width: number,
  noOfPieces: number
) => {
  if (!length || !width || !noOfPieces) return { kantanPerUnit: 0, reel: 0, inch: 0 };

  const kantanPerUnit = (length + width + 3 )* 2;
  const totalKantanInch = noOfPieces * kantanPerUnit;

  const reelSizeInInch = 200 * 36; // 7200
  const reel = Math.floor(totalKantanInch / reelSizeInInch);
  const inch = totalKantanInch % reelSizeInInch;

  return { kantanPerUnit, reel, inch };
};

// Calculate KG Paper based on ply and multiple paper GSMs
export const calculatePaperKg = (
  length: number,
  width: number,
  height: number,
  deckal: number,
  ply: number,
  paper3Gsm: number,
  paper2Gsm: number,
  paper1Gsm: number,
  noofpieces: number
  
) => {

  if (!length || !width || !height || !deckal || !ply) {
    return { p1Kg: 0, p2Kg: 0, p3Kg: 0, totalKg: 0 };
  }
  const abc = (length + width + 2) * 2;

  // Ply ke pattern ke hisaab se repetition nikalna
  let lengthCount = 0;
  let widthCount = 0;
  let heightCount = 0;

  const widthPlusHalf = width + width / 2;

  const paper2 = paper2Gsm + paper2Gsm / 2;

  for (let i = 1; i < ply; i++) {
    if (i % 2 !== 0) {
      // odd -> length
      lengthCount++;
    } else {
      // even -> width
      widthCount++;
    }
  }
  // last always height
  heightCount++;

  // Ab har paper ka kg nikalna
  const paper1Kg =
    ((paper3Gsm * lengthCount * deckal * abc) / 1550 / 1000 )*noofpieces;

  const paper2Kg =
    ((paper2 * widthCount * deckal * abc) / 1550 / 1000)*noofpieces;

  const paper3Kg =
    ((paper1Gsm * heightCount * deckal * abc) / 1550 / 1000)*noofpieces;

  const totalKgss = paper1Kg + paper2Kg + paper3Kg;

  return { paper1Kg, paper2Kg, paper3Kg, totalKgss };
};

