// src/lib/api.ts
// APIコールとデータ整形ロジックを担います。

import { Prefecture, PopulationData, PopulationValue } from '../types'; // 必要な型をインポート

// Next.js API Proxyのエンドポイント
// Next.jsサーバーサイドで実際の外部API（YumemiまたはMLIT）にアクセスすることを想定
const PREFECTURES_PROXY_URL = '/api/prefectures'; // 都道府県一覧用プロキシ
const POPULATION_PROXY_URL = '/api/population'; // 人口集中地区データ用プロキシ (旧 /api/yumemi) 

/**
 * ゆめみAPIから都道府県一覧を取得します。
 * @returns 都道府県の配列
 */
export const fetchPrefectures = async (): Promise<Prefecture[]> => {
  const endpoint = PREFECTURES_PROXY_URL;
  console.log(`[API] Fetching prefectures from proxy: ${endpoint}`);

  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      // プロキシからのエラー応答も確認
      const errorData = await response.json();
      console.error('Prefectures Proxy Error:', errorData);
      throw new Error(`Failed to fetch prefectures: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    
    // APIのレスポンス構造 (result: Prefecture[]) に合わせる
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
  const url = `${POPULATION_PROXY_URL}?prefCode=${prefCode}`; // プロキシに prefCode を渡す (サーバー側で処理を委譲)
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

    // --- MLIT データ整形ロジック (国土数値情報 人口集中地区データ形式を想定) ---
    
    // MLITデータ（国土数値情報）は`features`配列内の`properties`に情報が含まれていると仮定
    if (!json.features) {
        // データが存在しない、または構造が不正な場合
        return { prefCode, prefName, data: [] };
    }

    const populationValues: PopulationValue[] = [];
    // 人口集中地区は複数あるため、年ごとに人口を合計して時系列データを作成する
    const yearlyPopulationMap = new Map<number, number>();

    // フィルタリングと集計 (都道府県名でフィルタリングし、年ごとに人口を合計)
    json.features.forEach((feature: any) => {
        const properties = feature.properties;
        
        // N03_001 が都道府県名フィールドと仮定
        if (properties.N03_001 === prefName) {
            // N03_007 が基準年 (例: 2015) のフィールドと仮定
            // N03_004 が人口 (例: 123456) のフィールドと仮定
            const year = parseInt(properties.N03_007, 10);
            const value = parseInt(properties.N03_004, 10);
            
            if (!isNaN(year) && !isNaN(value)) {
                // 同じ年の人口を合計する (人口集中地区が複数あるため)
                const currentTotal = yearlyPopulationMap.get(year) || 0;
                yearlyPopulationMap.set(year, currentTotal + value);
            }
        }
    });

    // MapをPopulationValue配列に変換
    yearlyPopulationMap.forEach((value, year) => {
        populationValues.push({ year, value });
    });

    // 年でソート (時系列順)
    populationValues.sort((a, b) => a.year - b.year);

    // PopulationData 形式に整形して返す
    // ★FIX: 単一の PopulationData オブジェクトを返す
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