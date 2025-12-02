// src/types/index.ts
// アプリケーション全体で使用する型を定義します。

// ゆめみAPI 都道府県一覧のレスポンス型
export interface Prefecture {
  prefCode: number;
  prefName: string;
}

// MLIT APIのレスポンスから抽出する時系列データの値の型
// MLITのデータはRESASのような詳細な人口区分がないため、シンプルな時系列データとして扱う
export interface PopulationValue {
  year: number; // 基準年 (例: 1995, 2000, 2005...)
  value: number; // 人口集中地区の人口 (単位: 人)
}

// アプリケーション全体で保持する人口データ構造 (MLIT準拠)
export interface PopulationData {
  prefCode: number;
  prefName: string;
  // MLITのデータでは区分がないため、シンプルな配列として保持
  data: PopulationValue[];
}

// グラフ描画用に変換されたデータ系列の型
export interface ChartSeries {
  name: string; // 都道府県名
  data: [number, number][]; // [年, 人口] のタプルの配列
  color: string; // グラフの線色
}

// チェックボックスの状態を保持する型
export type SelectedPrefectures = Record<number, boolean>;

// MLITデータでは区分がないため、総人口で固定
export type PopulationType = '総人口';
