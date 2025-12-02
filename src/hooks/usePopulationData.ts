// src/hooks/usePopulationData.ts
// 都道府県の選択状態と人口データのフェッチ/整形を管理するカスタムフックです。

import { useState, useCallback, useMemo } from 'react';
import {
  Prefecture,
  PopulationData,
  SelectedPrefectures,
  ChartSeries,
  // PopulationType の型定義は不要になったため削除 (MLITデータは区分なし)
} from '../types';
import { fetchPopulation } from '../lib/api';

// MLITデータでは区分がないため、型を固定
export type PopulationType = '総人口';

// グラフの系列色を決定するためのシンプルなヘルパー関数
const getPrefectureColor = (prefCode: number): string => {
  const colors = [
    '#E53935', // Red
    '#43A047', // Green
    '#1E88E5', // Blue
    '#FFB300', // Yellow
    '#8E24AA', // Purple
    '#00ACC1', // Cyan
    '#F4511E', // Orange
    '#6D4C41', // Brown
    '#546E7A', // Slate
    '#D81B60', // Pink
  ];
  return colors[(prefCode - 1) % colors.length]; // 1から始まるprefCodeを考慮
};

/**
 * 都道府県の選択状態と人口集中地区データを管理するカスタムフック
 * @param allPrefectures 全都道府県のリスト
 */
export const usePopulationData = (allPrefectures: Prefecture[]) => {
  // 選択された都道府県コードとチェック状態のマップ
  const [selectedPrefs, setSelectedPrefs] = useState<SelectedPrefectures>({});
  
  // ★FIX 1: キャッシュの型を修正。APIの戻り値 PopulationData に合わせる
  // 取得済みの人口データをキャッシュするマップ (prefCode -> PopulationData)
  const [populationCache, setPopulationCache] = useState<Record<number, PopulationData>>({});
  
  // MLITデータでは区分がないため、'総人口'に固定
  const currentPopulationType: PopulationType = '総人口';
  
  // データ取得中の状態
  const [isFetching, setIsFetching] = useState<Record<number, boolean>>({});

  // データ取得とキャッシュの処理を行うコールバック
  const handlePrefectureToggle = useCallback(
    async (prefCode: number, isChecked: boolean, prefName: string) => {
      // 1. UIの選択状態を即時更新
      setSelectedPrefs(prev => ({
        ...prev,
        [prefCode]: isChecked,
      }));

      // 2. チェックが外れた場合 (データ削除)
      if (!isChecked) {
        setPopulationCache(prev => {
          const newCache = { ...prev };
          delete newCache[prefCode];
          return newCache;
        });
        return;
      }

      // 3. チェックが入った場合
      if (isChecked) {
        // キャッシュにデータがあれば何もしない
        if (populationCache[prefCode]) {
          return;
        }

        // 既にフェッチ中の場合は何もしない
        if (isFetching[prefCode]) {
          return;
        }

        // キャッシュにデータがなければ API を叩く
        try {
          setIsFetching(prev => ({ ...prev, [prefCode]: true }));
          
          // APIクライアントの呼び出し
          // newPopulationData は PopulationData 型 (単一オブジェクト)
          const newPopulationData = await fetchPopulation(prefCode, prefName);

          // ★FIX 2: newPopulationData が有効な単一オブジェクトであることを確認
          if (newPopulationData && newPopulationData.data && newPopulationData.data.length > 0) {
            // キャッシュに追加 (PopulationData 型をそのまま保存)
            setPopulationCache(prev => ({
              ...prev,
              [prefCode]: newPopulationData, // PopulationData 型を保存
            }));
          } else {
              // データが空の場合もエラーとして扱う
              throw new Error('APIから有効なデータが返されませんでした。');
          }
        } catch (error) {
          console.error(`人口データ取得エラー (${prefName}):`, error);
          
          // エラーが発生した場合、選択状態を元に戻す
          setSelectedPrefs(prev => ({
            ...prev,
            [prefCode]: false,
          }));
          console.error(`エラー: ${prefName} の人口データを取得できませんでした。`);
        } finally {
          setIsFetching(prev => ({ ...prev, [prefCode]: false }));
        }
      }
    },
    [populationCache, isFetching],
  );

  // グラフ描画用にデータを整形する処理 (メモ化)
  const chartSeries = useMemo((): ChartSeries[] => {
    // 選択された都道府県コードのリスト
    const selectedPrefCodes = allPrefectures
      .filter(pref => selectedPrefs[pref.prefCode])
      .map(pref => pref.prefCode);

    // 選択された都道府県の人口データ (PopulationData の配列) を抽出
    const dataForChart = selectedPrefCodes
      .map(prefCode => populationCache[prefCode])
      .filter((data): data is PopulationData => !!data); // データの存在確認

    // グラフの系列データを生成
    return dataForChart.map(data => {
      // data は単一の PopulationData オブジェクト
      
      // MLITデータは区分がないため、`data.data`配列を直接使用
      const chartPoints: [number, number][] = data.data
        ? data.data.map(item => [item.year, item.value])
        : [];

      return {
        name: data.prefName,
        // dataオブジェクトに prefCode と prefName が含まれていることを前提とする
        data: chartPoints,
        color: getPrefectureColor(data.prefCode),
      };
    });
  // 依存配列から currentPopulationType を削除 (固定のため)
  }, [selectedPrefs, populationCache, allPrefectures]);

  // MLITデータでは区分切り替えは行わないため、ダミー関数を返す
  const setCurrentPopulationType = useCallback(() => {}, []);

  return {
    selectedPrefCodeList: useMemo(() => {
        return allPrefectures
          .filter(pref => selectedPrefs[pref.prefCode])
          .map(pref => pref.prefCode);
    }, [selectedPrefs, allPrefectures]),
    currentPopulationType,
    handlePrefectureToggle,
    setCurrentPopulationType,
    chartSeries,
    isFetching,
    // グラフ描画用に、選択された都道府県に色を付けて返す
    selectedPrefecturesWithColor: useMemo(() => {
        return allPrefectures
            .filter(pref => selectedPrefs[pref.prefCode])
            .map(pref => ({
                ...pref,
                color: getPrefectureColor(pref.prefCode)
            }));
    }, [allPrefectures, selectedPrefs]),
  };
};