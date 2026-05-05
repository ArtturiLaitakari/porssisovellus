// Static fallback list of major Helsinki Exchange stocks
// Used when search field is empty or network is unavailable
export interface HelsinkiStock {
  symbol: string
  name: string
}

export const HELSINKI_STOCKS: HelsinkiStock[] = [
  // Blue chips / Large cap
  { symbol: 'NOKIA.HE', name: 'Nokia Corporation' },
  { symbol: 'NESTE.HE', name: 'Neste Corporation' },
  { symbol: 'FORTUM.HE', name: 'Fortum Corporation' },
  { symbol: 'UPM.HE', name: 'UPM-Kymmene Corporation' },
  { symbol: 'SAMPO.HE', name: 'Sampo Group' },
  { symbol: 'KONE.HE', name: 'KONE Corporation' },
  { symbol: 'STERV.HE', name: 'Stora Enso Corporation' },
  { symbol: 'KNEBV.HE', name: 'Konecranes Corporation' },
  { symbol: 'METSO.HE', name: 'Metso Corporation' },
  { symbol: 'ELISA.HE', name: 'Elisa Corporation' },
  
  // Mid cap
  { symbol: 'TYRES.HE', name: 'Nokian Tyres Corporation' },
  { symbol: 'TLS1V.HE', name: 'Telia Company' },
  { symbol: 'KESKOB.HE', name: 'Kesko Corporation' },
  { symbol: 'KOJAMO.HE', name: 'Kojamo Corporation' },
  { symbol: 'ORNBV.HE', name: 'Orion Corporation' },
  { symbol: 'HUH1V.HE', name: 'Huhtamaki Corporation' },
  { symbol: 'MUSTI.HE', name: 'Musti Group Corporation' },
  { symbol: 'TNOM.HE', name: 'TietoEVRY Corporation' },
  { symbol: 'WRT1V.HE', name: 'Wärtsilä Corporation' },
  { symbol: 'OUT1V.HE', name: 'Outokumpu Corporation' },
  
  // Small/mid cap
  { symbol: 'KAMUX.HE', name: 'Kamux Corporation' },
  { symbol: 'FARON.HE', name: 'Faron Pharmaceuticals' },
  { symbol: 'SSH1V.HE', name: 'SSH Communications Security' },
  { symbol: 'NEXT.HE', name: 'Next Games Corporation' },
  { symbol: 'REG1V.HE', name: 'Revenio Group Corporation' },
  { symbol: 'TOKMN.HE', name: 'Tokmanni Group Corporation' },
  { symbol: 'ATRAV.HE', name: 'Atraat Group' },
  { symbol: 'CAP1V.HE', name: 'CapMan Corporation' },
  { symbol: 'BOREO.HE', name: 'Boreo Corporation' },
  { symbol: 'NANOL.HE', name: 'Nanoform Finland Corporation' },
]