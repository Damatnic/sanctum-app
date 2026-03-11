import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city') || 'Waukesha, WI';

  try {
    const response = await fetch(
      `https://wttr.in/${encodeURIComponent(city)}?format=j1`,
      { next: { revalidate: 600 } } // Cache for 10 minutes
    );

    if (!response.ok) {
      throw new Error('Weather fetch failed');
    }

    const data = await response.json();
    const current = data.current_condition[0];
    const forecast = data.weather?.slice(0, 3) || [];

    const code = parseInt(current.weatherCode);
    let icon = '☁️';
    if (code === 113) icon = '☀️';
    else if (code <= 122) icon = '⛅';
    else if (code <= 299) icon = '🌧️';
    else if (code >= 300) icon = '🌨️';

    return NextResponse.json({
      current: {
        temp: current.temp_F,
        feelsLike: current.FeelsLikeF,
        condition: current.weatherDesc[0].value,
        icon,
        humidity: current.humidity,
        windSpeed: current.windspeedMiles,
      },
      forecast: forecast.map((day: any) => ({
        high: day.maxtempF,
        low: day.mintempF,
        icon: parseInt(day.hourly[4].weatherCode) === 113 ? '☀️' : 
              parseInt(day.hourly[4].weatherCode) <= 122 ? '⛅' : '🌧️',
      })),
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather' },
      { status: 500 }
    );
  }
}
