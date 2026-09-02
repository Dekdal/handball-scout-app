import pandas as pd
import numpy as np

def carregar_dados(caminho_arquivo: str) -> pd.DataFrame:
    """Carrega o arquivo CSV ou Excel contendo a aba Base_Eventos."""
    if caminho_arquivo.endswith('.csv'):
        df = pd.read_csv(caminho_arquivo)
    else:
        df = pd.read_excel(caminho_arquivo, sheet_name='Base_Eventos')
    
    colunas_esperadas = [
        'Partida', 'Periodo', 'Tempo', 'Equipe', 'Setor', 
        'Gol_Jogador', 'Assistencia', 'Jogada', 'Resultado', 'Avaliacao',
        'Pseudo_Assistencia', 'Estrutura_Tatica', 'Motivo_Perda', 'Setor_Defensivo'
    ]
    for col in colunas_esperadas:
        if col not in df.columns:
            df[col] = None
            
    return df

def analise_artilharia_e_garcons(df: pd.DataFrame, nosso_time: str):
    """Gera ranking de Artilheiros, Garçons e Criadores de Pseudo-Assistências."""
    print("=" * 60)
    print(f"📊 DASHBOARD DOS JOGADORES - {nosso_time}")
    print("=" * 60)

    # Filtrar apenas lances do nosso time
    nosso_df = df[df['Equipe'] == nosso_time] if 'Equipe' in df.columns else df

    # Artilheiros
    artilheiros = nosso_df[nosso_df['Resultado'].str.upper() == 'GOL']['Gol_Jogador'].value_counts()
    print("\n⚽ RANKING DE ARTILHEIROS (GOLS):")
    for jogador, gols in artilheiros.items():
        if pd.notna(jogador):
            print(f"  • Camisa #{jogador}: {gols} gol(s)")

    # Assistências
    assistencias = nosso_df[nosso_df['Resultado'].str.upper() == 'GOL']['Assistencia'].value_counts()
    print("\n🎯 RANKING DE ASSISTÊNCIAS DIRETAS:")
    for jogador, ass in assistencias.items():
        if pd.notna(jogador):
            print(f"  • Camisa #{jogador}: {ass} assistência(s)")

    # Pseudo-Assistências (Bolas claras deixadas para gol que foram perdidas)
    pseudo = nosso_df[(nosso_df['Resultado'].str.upper() != 'GOL') & (nosso_df['Assistencia'].notna())]
    print("\n💡 RANKING DE PSEUDO-ASSISTÊNCIAS (Chances Claras Criadas Perdidas):")
    for jogador, count in pseudo['Assistencia'].value_counts().items():
        if pd.notna(jogador):
            print(f"  • Camisa #{jogador}: {count} oportunidade(s) criada(s) não convertida(s)")
    print("\n")

def analise_estruturas_taticas(df: pd.DataFrame, nosso_time: str):
    """Calcula a efetividade por tipo de jogada tática."""
    print("=" * 60)
    print("🎯 EFETIVIDADE POR ESTRUTURA TÁTICA DE JOGADA")
    print("=" * 60)

    nosso_df = df[df['Equipe'] == nosso_time] if 'Equipe' in df.columns else df

    if 'Jogada' in nosso_df.columns:
        resumo = nosso_df.groupby('Jogada')['Resultado'].value_counts().unstack(fill_value=0)
        if 'Gol' in resumo.columns:
            resumo['Total_Oportunidades'] = resumo.sum(axis=1)
            resumo['Efetividade_%'] = (resumo['Gol'] / resumo['Total_Oportunidades'] * 100).round(1)
            print(resumo[['Total_Oportunidades', 'Gol', 'Efetividade_%']])
    print("\n")

def analise_perdas_posse(df: pd.DataFrame, nosso_time: str):
    """Mapeia as causas exatas das perdas de bola (Turnovers)."""
    print("=" * 60)
    print("⚠️ ANÁLISE DE PERDAS DE BOLA (TURNOVERS)")
    print("=" * 60)

    perdas = df[(df['Equipe'] == nosso_time) & (df['Resultado'].str.upper().str.contains('PERDA|ERRO|FALTA', na=False))]
    total_perdas = len(perdas)

    print(f"Total de Perdas de Posse Registradas: {total_perdas}")
    if 'Motivo_Perda' in perdas.columns and perdas['Motivo_Perda'].notna().any():
        motivos = perdas['Motivo_Perda'].value_counts()
        for motivo, qtd in motivos.items():
            pct = (qtd / total_perdas * 100) if total_perdas > 0 else 0
            print(f"  • {motivo}: {qtd} vezes ({pct:.1f}%)")
    print("\n")

def parecer_tatico_executivo(df: pd.DataFrame, nosso_time: str):
    """Gera o parecer descritivo pós-jogo automático."""
    print("=" * 60)
    print("📝 PARECER TÁTICO DESCRITIVO AUTOMATIZADO")
    print("=" * 60)

    total_lances = len(df[df['Equipe'] == nosso_time])
    gols = len(df[(df['Equipe'] == nosso_time) & (df['Resultado'].str.upper() == 'GOL')])
    eficiencia = (gols / total_lances * 100) if total_lances > 0 else 0

    print(f"1. APROVEITAMENTO GERAL: A equipe obteve {eficiencia:.1f}% de conversão no ataque ({gols} gols em {total_lances} ações).")
    print("2. DIAGNÓSTICO DEFENSIVO: Recomendado intensificar o trabalho de cobertura lateral entre defensores bases.")
    print("3. CONTROLE DE POSSE: Priorizar o passe seguro em jogadas de engajamento para reduzir perdas de bola no pivô.")
    print("=" * 60)

if __name__ == "__main__":
    import sys
    arquivo = sys.argv[1] if len(sys.argv) > 1 else 'exemplo_base_eventos.csv'
    nosso_time = sys.argv[2] if len(sys.argv) > 2 else 'UFAL'

    df = carregar_dados(arquivo)
    analise_artilharia_e_garcons(df, nosso_time)
    analise_estruturas_taticas(df, nosso_time)
    analise_perdas_posse(df, nosso_time)
    parecer_tatico_executivo(df, nosso_time)
