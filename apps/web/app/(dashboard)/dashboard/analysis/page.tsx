'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation' // Corrected import
import {
  getAggregatedClicks,
  getAggregatedDevices,
  getAggregatedBrowsers,
  getAggregatedReferrers,
  getAggregatedCountries,
  ClickOverTimeStat,
  BreakdownStats
} from '@/lib/api'

import { VerticalStackedBarChartAnalytics } from '@/components/VerticalStackedBarChartAnalytics'
import { DeviceLineChart } from '@/components/DeviceLineChart'
import { CountryPieChart } from '@/components/CountryPieChart'
import { ReferrerPieChart } from '@/components/ReferrerPieChart'
import { ClicksOverTimeChart } from '@/components/ClicksOverTimeChart'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"


export default function AnalysisPage() {
  const router = useRouter(); 

  // State for each data set
  const [clicksData, setClicksData] = useState<ClickOverTimeStat[]>([]);
  const [deviceData, setDeviceData] = useState<BreakdownStats>({});
  const [browserData, setBrowserData] = useState<BreakdownStats>({});
  const [referrerData, setReferrerData] = useState<BreakdownStats>({});
  const [countryData, setCountryData] = useState<BreakdownStats>({});

  // State for loading, errors, and time interval
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeInterval, setTimeInterval] = useState<'day' | 'month' | 'year'>('day');

  // Fetch all data on mount and when interval changes
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Not authenticated. Redirecting to login...");
        setTimeout(() => router.push('/login'), 1500); 
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [
          clicksRes,
          devicesRes,
          browsersRes,
          referrersRes,
          countriesRes
        ] = await Promise.all([
          getAggregatedClicks(token, timeInterval),
          getAggregatedDevices(token),
          getAggregatedBrowsers(token),
          getAggregatedReferrers(token),
          getAggregatedCountries(token)
        ]);

        setClicksData(clicksRes || []);
        setDeviceData(devicesRes || {});
        setBrowserData(browsersRes || {});
        setReferrerData(referrersRes || {});
        setCountryData(countriesRes || {});

      } catch (err: unknown) {
        console.error("Failed to load analysis data:", err);
        setError('Failed to load analysis data. Please try again later.');
        if (String(err).includes('401') || String(err).includes('credentials')) {
            localStorage.removeItem('token'); localStorage.removeItem('userEmail');
            router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeInterval, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-gray-500">Loading analysis data...</p>
      </div>
    );
  }

  if (error) {
     return (
       <div className="flex items-center justify-center p-10">
         <p className="text-gray-500">{error}</p>
       </div>
     );
  }

  // --- Main Render ---
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          Aggregated Link Analysis
        </h2>
      </div>


      {/* --- Section 1: Clicks Over Time --- */}
       <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className='space-y-1'>
                <CardTitle className="text-xl font-semibold">Total Clicks Over Time</CardTitle>
                <CardDescription>Total clicks across all your links</CardDescription>
            </div>
             <Select value={timeInterval} onValueChange={(value) => setTimeInterval(value as 'day' | 'month' | 'year')}>
                <SelectTrigger className="w-[120px]" aria-label="Select time interval">
                    <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="day">Daily</SelectItem>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
             </Select>
          </CardHeader>
          <CardContent>
            <ClicksOverTimeChart chartData={clicksData} timeRange={timeInterval} />
          </CardContent>
       </Card>


       {/* --- Section 2: Breakdowns --- */}
       <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
           {/* Device & Browser */}
           <div className="space-y-6">
              <DeviceLineChart
                 title="Device Types"
                 description="Breakdown by device category"
                 data={deviceData}
               />
               <VerticalStackedBarChartAnalytics
                 title="Browsers"
                 description="Top 5 browsers used"
                 data={browserData}
                 dataKey="Browser"
               />
           </div>

           {/* Country & Referrer */}
           <div className="space-y-6">
              <CountryPieChart
                 title="Countries"
                 description="Top 5 countries by clicks"
                 data={countryData}
               />
               <ReferrerPieChart
                 title="Referrers"
                 description="Top 5 referring sources"
                 data={referrerData}
               />
           </div>
       </div>
    </div>
  )
}