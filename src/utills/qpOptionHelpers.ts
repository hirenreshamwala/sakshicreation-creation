export interface OptionType {
  label: string
  value: string
}

// ✅ Common select option finder
export const getSelectedOption = (value: string, options: OptionType[]) => {
  return options.find((option) => option.value === value) || null
}

// ✅ Packaging Options Helpers
export const getUniqueNameOptions = (packagingOptions: any[]) => {
  const uniqueNames = [...new Set(packagingOptions?.map((item) => item.name))].sort()
  return uniqueNames?.map((name) => ({ value: name, label: name }))
}

export const getUniquePlyOptions = (packagingOptions: any[], qpFormData: any) => {
  const filteredOptions = packagingOptions?.filter((item: any) =>
    (!qpFormData.name || item.name === qpFormData.name) &&
    (!qpFormData.length || item.length === qpFormData.length) &&
    (!qpFormData.width || item.width === qpFormData.width) &&
    (!qpFormData.height || item.height === qpFormData.height)
  )
  const uniquePlies = [...new Set(filteredOptions?.map((item: any) => item.ply))].sort()
  return uniquePlies?.map((ply) => ({ value: ply, label: `${ply}` }))
}

export const getUniqueLengthOptions = (packagingOptions: any[], qpFormData: any) => {
  const filteredOptions = packagingOptions?.filter((item: any) =>
    (!qpFormData.name || item.name === qpFormData.name) &&
    (!qpFormData.ply || item.ply === qpFormData.ply) &&
    (!qpFormData.width || item.width === qpFormData.width) &&
    (!qpFormData.height || item.height === qpFormData.height)
  )
  const uniqueLengths = [...new Set(filteredOptions.map((item: any) => item.length))].sort()
  return uniqueLengths?.map((length) => ({ value: length, label: length }))
}

export const getUniqueWidthOptions = (packagingOptions: any[], qpFormData: any) => {
  const filteredOptions = packagingOptions?.filter((item: any) =>
    (!qpFormData.name || item.name === qpFormData.name) &&
    (!qpFormData.ply || item.ply === qpFormData.ply) &&
    (!qpFormData.length || item.length === qpFormData.length) &&
    (!qpFormData.height || item.height === qpFormData.height)
  )
  const uniqueWidths = [...new Set(filteredOptions?.map((item: any) => item.width))].sort()
  return uniqueWidths?.map((width) => ({ value: width, label: width }))
}

export const getUniqueHeightOptions = (packagingOptions: any[], qpFormData: any) => {
  const filteredOptions = packagingOptions?.filter((item: any) =>
    (!qpFormData.name || item.name === qpFormData.name) &&
    (!qpFormData.ply || item.ply === qpFormData.ply) &&
    (!qpFormData.length || item.length === qpFormData.length) &&
    (!qpFormData.width || item.width === qpFormData.width)
  )
  const uniqueHeights = [...new Set(filteredOptions?.map((item: any) => item.height))].sort()
  return uniqueHeights?.map((height) => ({ value: height, label: height }))
}

// ✅ Paper Options Helpers
export const getPaperNameOptions = (paperGSM: any[]) => {
  const uniqueNames = [...new Set(paperGSM?.map((item: any) => item.name))].sort()
  return uniqueNames?.map((name) => ({ value: name, label: name }))
}

export const getPaperLengthOptions = (paperGSM: any[], qpFormData: any) => {
  const filteredOptions = paperGSM?.filter((item: any) =>
    (!qpFormData.paperName || item.name === qpFormData.paperName) &&
    (!qpFormData.paperWidth || item.width === qpFormData.paperWidth) &&
    (!qpFormData.paperHeight || item.height === qpFormData.paperHeight)
  )
  const uniqueLengths = [...new Set(filteredOptions?.map((item: any) => item.length))].sort()
  return uniqueLengths?.map((length) => ({ value: length, label: length }))
}

export const getPaperWidthOptions = (paperGSM: any[], qpFormData: any) => {
  const filteredOptions = paperGSM?.filter((item: any) =>
    (!qpFormData.paperName || item.name === qpFormData.paperName) &&
    (!qpFormData.paperLength || item.length === qpFormData.paperLength) &&
    (!qpFormData.paperHeight || item.height === qpFormData.paperHeight)
  )
  const uniqueWidths = [...new Set(filteredOptions?.map((item: any) => item.width))].sort()
  return uniqueWidths?.map((width) => ({ value: width, label: width }))
}

export const getPaperHeightOptions = (paperGSM: any[], qpFormData: any) => {
  const filteredOptions = paperGSM?.filter((item: any) =>
    (!qpFormData.paperName || item.name === qpFormData.paperName) &&
    (!qpFormData.paperLength || item.length === qpFormData.paperLength) &&
    (!qpFormData.paperWidth || item.width === qpFormData.paperWidth)
  )
  const uniqueHeights = [...new Set(filteredOptions?.map((item: any) => item.height))].sort()
  return uniqueHeights?.map((height) => ({ value: height, label: height }))
}
