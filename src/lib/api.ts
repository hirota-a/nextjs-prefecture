// src/lib/api.ts
// APIコールとデータ整形ロジックを担います。

import { Prefecture, PopulationData, PopulationValue } from '../types'; // 必要な型をインポート

// Next.js API Proxyのエンドポイント
// すべてのリクエストを単一の動的ルート `/api/yumemi/[...path]` に統合します。
const YUMEMI_PROXY_BASE_URL = '/api/yumemi'; 

// 都道府県一覧と人口データの両方に使用するエンドポイントパス
const PREFECTURES_PATH = '/prefectures';
const POPULATION_PATH = '/population';

/**
 * Next.js API Proxyを経由して都道府県一覧を取得します。
 * @returns 都道府県の配列
 */
export const fetchPrefectures = async (): Promise<Prefecture[]> => {
  // ★修正: /api/prefectures から /api/yumemi/prefectures に変更
  const endpoint = `${YUMEMI_PROXY_BASE_URL}${PREFECTURES_PATH}`;
  console.log(`[API] Fetching prefectures from proxy: ${endpoint}`);

  try {
    // Next.js API Proxyを経由
    const response = await fetch(endpoint);

    if (!response.ok) {
      // プロキシからのエラー応答も確認
      const errorData = await response.json();
      console.error('Prefectures Proxy Error:', errorData);
      throw new Error(`Failed to fetch prefectures: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    
    // プロキシが返す構造（Yumemi APIの result: Prefecture[]）に合わせる
    if (json.result && Array.isArray(json.result)) {
      return json.result;
    }
    
    throw new Error("Invalid API response structure: missing 'result' array.");

  } catch (error) {
    console.error('Error fetching prefectures:', error);
    // UI側でエラーメッセージを表示させるため、エラーを再スロー
    throw new Error('都道府県データの取得に失敗しました。');
  }
};

/**
 * Next.js API Proxyを経由してMLIT DATAPLATFORMから人口集中地区データを取得し、整形します。
 * @param prefCode 取得したい都道府県のコード
 * @param prefName 取得したい都道府県名
 * @returns 整形された単一の人口データオブジェクト (PopulationData)
 */
export const fetchPopulation = async (
  prefCode: number,
  prefName: string,
): Promise<PopulationData> => {
  // ★修正: /api/population から /api/yumemi/population に変更
  const url = `${YUMEMI_PROXY_BASE_URL}${POPULATION_PATH}?prefCode=${prefCode}&prefName=${prefName}`; 
  console.log(`[API] Fetching population for ${prefName} (${prefCode}) from proxy: ${url}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      // プロキシからのエラー応答も確認
      const errorData = await response.json();
      console.error('MLIT API Proxy Error:', errorData);
      throw new Error(`Failed to fetch population data: ${response.statusText}`);
    }
    const json = await response.json();

    // --- MLIT データ整形ロジック (GeoJSON形式を想定) ---
    // ... (整形ロジックは変更なし、サーバーサイドの /api/yumemi/[...path] で処理される)
    
    if (!json.features) {
        return { prefCode, prefName, data: [] };
    }
    // ... (中略：集計ロジックはサーバー側に移譲されるため、フロントエンドでは結果を待つだけ)

    const yearlyPopulationMap = new Map<number, number>();
    json.features.forEach((feature: any) => {
        const properties = feature.properties;
        if (properties.N03_001 === prefName) {
            const year = parseInt(properties.N03_007, 10);
            const value = parseInt(properties.N03_004, 10);
            if (!isNaN(year) && !isNaN(value)) {
                const currentTotal = yearlyPopulationMap.get(year) || 0;
                yearlyPopulationMap.set(year, currentTotal + value);
            }
        }
    });

    const populationValues: PopulationValue[] = [];
    yearlyPopulationMap.forEach((value, year) => {
        populationValues.push({ year, value });
    });
    populationValues.sort((a, b) => a.year - b.year);

    return {
        prefCode,
        prefName,
        data: populationValues,
    };
  } catch (error) {
    console.error(`Error fetching population data for prefCode ${prefCode}:`, error);
    throw new Error('人口構成データの取得中にエラーが発生しました。');
  }
};