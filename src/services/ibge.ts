export interface IBGEMunicipio {
  id: number;
  nome: string;
  microrregiao?: {
    mesorregiao?: {
      UF?: {
        sigla: string;
      }
    }
  }
}

let cachedCities: string[] | null = null;

export async function getCidadesBrasileiras(): Promise<string[]> {
  if (cachedCities) return cachedCities;
  try {
    const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios');
    const data: IBGEMunicipio[] = await response.json();
    cachedCities = data
      .filter(m => m && m.nome)
      .map(m => {
        const uf = m.microrregiao?.mesorregiao?.UF?.sigla;
        return uf ? `${m.nome} - ${uf}` : m.nome;
      })
      .sort();
    return cachedCities;
  } catch (error) {
    console.error("Erro ao buscar cidades do IBGE:", error);
    return [];
  }
}
