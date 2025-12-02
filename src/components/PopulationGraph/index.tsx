// src/components/PopulationGraph/index.tsx
// Highchartsを使って人口推移のグラフを表示するUIコンポーネントです。

import React, { memo, useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { ChartSeries, PopulationType } from '../../types';

interface PopulationGraphProps {
  chartSeries: ChartSeries[];
  // PopulationTypeは総人口で固定されますが、型の互換性のため残します
  currentPopulationType: PopulationType;
  // この関数はフック側でダミーとなり、UIからは削除されます
  setCurrentPopulationType: (type: PopulationType) => void; 
}

/**
 * 人口集中地区の時系列グラフを表示するコンポーネント
 */
export const PopulationGraph: React.FC<PopulationGraphProps> = memo(
  ({ chartSeries, currentPopulationType }) => {
    // HighchartsのオプションをuseMemoで生成
    const options: Highcharts.Options = useMemo(() => {
      // グラフのデータ系列を Highcharts の形式に変換
      const series: Highcharts.SeriesOptionsType[] = chartSeries.map(
        seriesData => ({
          type: 'line',
          name: seriesData.name,
          data: seriesData.data, // [year, value] のタプルの配列
          color: seriesData.color,
          marker: {
            // ポイントマーカー
            enabled: true,
            symbol: 'circle',
            radius: 4, // 点が少なくなるため、点を大きく表示
          },
          lineWidth: 3,
        }),
      );

      // X軸の最小値と最大値をデータから動的に決定
      const allYears = chartSeries.flatMap(s => s.data.map(d => d[0]));
      const minYear = allYears.length > 0 ? Math.min(...allYears) : 1960;
      const maxYear = allYears.length > 0 ? Math.max(...allYears) : 2025; 

      return {
        chart: {
          type: 'line',
          style: {
            fontFamily: "'Inter', sans-serif",
          },
          backgroundColor: '#ffffff',
        },
        title: {
          // タイトルを「人口集中地区の人口推移」に変更
          text: '人口集中地区（DID）の人口推移',
          align: 'left',
          style: {
            fontSize: '1.5rem',
            color: '#333',
            fontWeight: '600',
          },
        },
        xAxis: {
          title: {
            text: '基準年 (国勢調査)',
            style: { color: '#555' }
          },
          min: minYear,
          max: maxYear,
          tickInterval: 5, // 5年ごとに目盛りを表示 (MLITデータは5年ごとのため)
          gridLineWidth: 1, // 縦のグリッド線
          labels: {
            formatter: function() {
              return this.value.toString();
            }
          }
        },
        yAxis: {
          title: {
            text: '人口集中地区人口',
            style: { color: '#555' }
          },
          // 数値を日本の形式で表示（カンマ区切り、単位）
          labels: {
            formatter: function() {
              return Highcharts.numberFormat(this.value as number, 0, '.', ',') + ' 人';
            }
          },
          gridLineWidth: 1,
        },
        tooltip: {
          shared: true,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: '#ccc',
          borderRadius: 4,
          formatter: function (this: Highcharts.TooltipFormatterContextObject) {
            // ツールチップのカスタム表示
            const header = `<span style="font-size: 10px">${this.x}年 (基準年)</span><br/>`;
            const points = this.points ? this.points.map(p => 
              `<span style="color:${p.series.color}">\u25CF</span> ${p.series.name}: <b>${Highcharts.numberFormat(p.y as number, 0, '.', ',')}</b>人<br/>`
            ).join('') : '';
            return header + points;
          }
        },
        legend: {
          layout: 'horizontal',
          align: 'center',
          verticalAlign: 'bottom',
          itemStyle: {
            fontWeight: 'normal',
            fontSize: '0.875rem',
            color: '#555'
          },
        },
        series: series,
        credits: {
          enabled: false,
        },
        responsive: {
          rules: [
            {
              condition: {
                maxWidth: 600,
              },
              chartOptions: {
                legend: {
                  align: 'center',
                  verticalAlign: 'bottom',
                  layout: 'horizontal',
                },
                title: {
                  style: {
                    fontSize: '1.2rem',
                  },
                },
              },
            },
          ],
        },
      } as Highcharts.Options;
    }, [chartSeries]);

    return (
      <div className="graph-container">
        {/* MLITデータでは区分切り替えUIは削除 */}

        <div className="chart-area">
          {chartSeries.length === 0 ? (
            <div className="no-data-message">
              <p>左側の都道府県一覧から、グラフに表示したい都道府県を選択してください。</p>
              <p style={{ marginTop: '10px', fontSize: '0.9rem', color: '#888' }}>
                （データは国土交通データプラットフォームの人口集中地区情報を使用しています）
              </p>
            </div>
          ) : (
            // HighchartsReactコンポーネント
            <HighchartsReact highcharts={Highcharts} options={options} />
          )}
        </div>

        {/* styleプロパティをjsx globalで記述 */}
        <style jsx global>{`
          .graph-container {
            padding: 24px;
            min-height: 100%;
          }
          
          .chart-area {
            min-height: 400px;
            border: 1px solid var(--color-border);
            border-radius: 8px;
            padding: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .no-data-message {
            color: #777;
            font-size: 1.1rem;
            text-align: center;
            padding: 40px;
          }
          
          /* スマホ対応 */
          @media (max-width: 600px) {
            .graph-container {
              padding: 16px;
            }
          }
        `}</style>
      </div>
    );
  },
);

PopulationGraph.displayName = 'PopulationGraph';
