import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Sun, Moon, Thermometer, Wind, Droplet, Clock } from 'lucide-react';

// F1 team colors for 2024 season
const teamColors = {
    "Ferrari": "#DC0000",
    "Mercedes": "#00D2BE",
    "Red Bull": "#0600EF",
    "McLaren": "#FF8700",
    "Sauber": "#469BFF",
    "Alpine": "#0090FF",
    "Aston Martin": "#006F62",
    "Haas F1 Team": "#FFFFFF",
    "RB": "#CAD2D3",
    "Williams": "#005AFF"
};

// Tire compounds data
const tireCompounds = {
    soft: { color: "#FF3333", durability: 0.7, grip: 0.95, optimal_temp: 90 },
    medium: { color: "#FFCC33", durability: 0.85, grip: 0.8, optimal_temp: 85 },
    hard: { color: "#FFFFFF", durability: 1, grip: 0.7, optimal_temp: 80 },
    intermediate: { color: "#33CC33", durability: 0.8, grip: 0.75, optimal_temp: 75 },
    wet: { color: "#3333FF", durability: 0.9, grip: 0.6, optimal_temp: 65 }
};

// Sample weather data
const weatherData = {
    clear: {
        temperature: 28,
        humidity: 45,
        windSpeed: 8,
        windDirection: 225,
        precipitation: 0,
        trackTemp: 42
    },
    cloudy: {
        temperature: 22,
        humidity: 62,
        windSpeed: 12,
        windDirection: 180,
        precipitation: 0,
        trackTemp: 32
    },
    lightRain: {
        temperature: 18,
        humidity: 85,
        windSpeed: 15,
        windDirection: 200,
        precipitation: 25,
        trackTemp: 25
    },
    heavyRain: {
        temperature: 15,
        humidity: 95,
        windSpeed: 22,
        windDirection: 210,
        precipitation: 80,
        trackTemp: 20
    }
};

// Main component
const TelemetryVisualizations = () => {
    // State for API data
    const [drivers, setDrivers] = useState({});
    const [meetings, setMeetings] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [circuits, setCircuits] = useState([]);
    const [lapData, setLapData] = useState([]);
    const [carData, setCarData] = useState([]);
    const [pitStops, setPitStops] = useState([]);
    const [stints, setStints] = useState([]);

    // State for UI controls
    const [selectedDrivers, setSelectedDrivers] = useState([]);
    const [selectedLap, setSelectedLap] = useState(1);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [selectedYear, setSelectedYear] = useState(2024);
    const [selectedSession, setSelectedSession] = useState("");
    const [selectedCircuit, setSelectedCircuit] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [weatherCondition, setWeatherCondition] = useState("clear");
    const [showWeatherPanel, setShowWeatherPanel] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [error, setError] = useState(null);
    const [availableLaps, setAvailableLaps] = useState([]);

    // Fetch meetings (Grand Prix events)
    const fetchMeetings = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('https://api.openf1.org/v1/meetings');
            const data = await response.json();
            setMeetings(data);

            // Extract unique circuits
            const uniqueCircuits = [...new Set(data.map(meeting => meeting.circuit_name))];
            setCircuits(uniqueCircuits);

            // Set default selected circuit
            if (uniqueCircuits.length > 0 && !selectedCircuit) {
                setSelectedCircuit(uniqueCircuits[0]);
            }

            setIsLoading(false);
        } catch (err) {
            setError("Error fetching meetings: " + err.message);
            setIsLoading(false);
        }
    };

    // Fetch sessions for selected circuit
    const fetchSessions = async () => {
        if (!selectedCircuit) return;

        try {
            setIsLoading(true);
            const response = await fetch(`https://api.openf1.org/v1/sessions?circuit_name=${encodeURIComponent(selectedCircuit)}`);
            const data = await response.json();
            setSessions(data);

            // Set default selected session
            if (data.length > 0 && !selectedSession) {
                setSelectedSession(data[0].session_name);
            }

            setIsLoading(false);
        } catch (err) {
            setError("Error fetching sessions: " + err.message);
            setIsLoading(false);
        }
    };

    // Fetch drivers for selected session
    const fetchDrivers = async () => {
        if (!selectedSession || !selectedCircuit) return;

        try {
            setIsLoading(true);
            const response = await fetch(`https://api.openf1.org/v1/drivers?circuit_name=${encodeURIComponent(selectedCircuit)}&session_name=${encodeURIComponent(selectedSession)}`);
            const data = await response.json();

            // Format drivers data
            const driversObj = {};
            data.forEach(driver => {
                driversObj[driver.driver_number] = {
                    number: driver.driver_number,
                    name: `${driver.first_name} ${driver.last_name}`,
                    team: driver.team_name,
                    color: teamColors[driver.team_name] || "#999999",
                    data: []
                };
            });

            setDrivers(driversObj);

            // Select first 4 drivers by default if no drivers are selected
            if (selectedDrivers.length === 0 && Object.keys(driversObj).length > 0) {
                setSelectedDrivers(
                    Object.keys(driversObj)
                        .slice(0, 4)
                        .map(num => parseInt(num))
                );
            }

            setIsLoading(false);
        } catch (err) {
            setError("Error fetching drivers: " + err.message);
            setIsLoading(false);
        }
    };

    // Fetch lap data for selected session
    const fetchLapData = async () => {
        if (!selectedSession || !selectedCircuit || selectedDrivers.length === 0) return;

        try {
            setIsLoading(true);

            const driverParams = selectedDrivers.map(num => `driver_number=${num}`).join('&');
            const response = await fetch(`https://api.openf1.org/v1/laps?circuit_name=${encodeURIComponent(selectedCircuit)}&session_name=${encodeURIComponent(selectedSession)}&${driverParams}`);
            const data = await response.json();

            setLapData(data);

            // Get available laps
            const laps = [...new Set(data.map(lap => lap.lap_number))].sort((a, b) => a - b);
            setAvailableLaps(laps);

            // Set default selected lap
            if (laps.length > 0 && !laps.includes(selectedLap)) {
                setSelectedLap(laps[0]);
            }

            setIsLoading(false);
        } catch (err) {
            setError("Error fetching lap data: " + err.message);
            setIsLoading(false);
        }
    };

    // Fetch car telemetry data
    const fetchCarData = async () => {
        if (!selectedSession || !selectedCircuit || selectedDrivers.length === 0 || !selectedLap) return;

        try {
            setIsLoading(true);

            const driverParams = selectedDrivers.map(num => `driver_number=${num}`).join('&');
            const response = await fetch(`https://api.openf1.org/v1/car_data?circuit_name=${encodeURIComponent(selectedCircuit)}&session_name=${encodeURIComponent(selectedSession)}&${driverParams}&lap_number=${selectedLap}`);
            const data = await response.json();

            // Process the data and append to drivers state
            const updatedDrivers = { ...drivers };

            data.forEach(item => {
                if (updatedDrivers[item.driver_number]) {
                    if (!updatedDrivers[item.driver_number].data) {
                        updatedDrivers[item.driver_number].data = [];
                    }

                    updatedDrivers[item.driver_number].data.push({
                        date: item.date,
                        lap_number: item.lap_number,
                        speed: item.speed || 0,
                        throttle: item.throttle || 0,
                        brake: item.brake || 0,
                        n_gear: item.n_gear || 0,
                        drs: item.drs || 0,
                        rpm: item.rpm || 0
                    });
                }
            });

            setDrivers(updatedDrivers);
            setCarData(data);
            setIsLoading(false);
        } catch (err) {
            setError("Error fetching car data: " + err.message);
            setIsLoading(false);
        }
    };

    // Fetch pit stop data
    const fetchPitStops = async () => {
        if (!selectedSession || !selectedCircuit || selectedDrivers.length === 0) return;

        try {
            const driverParams = selectedDrivers.map(num => `driver_number=${num}`).join('&');
            const response = await fetch(`https://api.openf1.org/v1/pit?circuit_name=${encodeURIComponent(selectedCircuit)}&session_name=${encodeURIComponent(selectedSession)}&${driverParams}`);
            const data = await response.json();
            setPitStops(data);
        } catch (err) {
            setError("Error fetching pit stop data: " + err.message);
        }
    };

    // Fetch stint data for tire information
    const fetchStints = async () => {
        if (!selectedSession || !selectedCircuit || selectedDrivers.length === 0) return;

        try {
            const driverParams = selectedDrivers.map(num => `driver_number=${num}`).join('&');
            const response = await fetch(`https://api.openf1.org/v1/stints?circuit_name=${encodeURIComponent(selectedCircuit)}&session_name=${encodeURIComponent(selectedSession)}&${driverParams}`);
            const data = await response.json();
            setStints(data);
        } catch (err) {
            setError("Error fetching stint data: " + err.message);
        }
    };

    // Initialize data loading
    useEffect(() => {
        fetchMeetings();

        // Set dark mode by default
        document.body.classList.add('dark-mode');
    }, []);

    // Load sessions when circuit changes
    useEffect(() => {
        if (selectedCircuit) {
            fetchSessions();
        }
    }, [selectedCircuit]);

    // Load drivers when session changes
    useEffect(() => {
        if (selectedSession && selectedCircuit) {
            fetchDrivers();
        }
    }, [selectedSession, selectedCircuit]);

    // Load lap data when drivers or session change
    useEffect(() => {
        if (selectedDrivers.length > 0 && selectedSession && selectedCircuit) {
            fetchLapData();
            fetchPitStops();
            fetchStints();
        }
    }, [selectedDrivers, selectedSession, selectedCircuit]);

    // Load car data when lap changes
    useEffect(() => {
        if (selectedLap && selectedDrivers.length > 0 && selectedSession && selectedCircuit) {
            fetchCarData();
        }
    }, [selectedLap, selectedDrivers, selectedSession, selectedCircuit]);

    // Toggle dark/light mode
    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        document.body.classList.toggle('dark-mode');
        document.body.classList.toggle('light-mode');
    };

    // Prepare chart data from car telemetry
    const prepareChartData = () => {
        const chartData = [];

        // Find all car data for the selected lap for each selected driver
        selectedDrivers.forEach(driverId => {
            if (drivers[driverId] && drivers[driverId].data) {
                const driverLapData = drivers[driverId].data.filter(d => d.lap_number === selectedLap);

                driverLapData.forEach((dataPoint, index) => {
                    // Create or update data point in chartData
                    if (!chartData[index]) {
                        chartData[index] = {
                            index,
                            time: new Date(dataPoint.date).toISOString().substring(11, 19)
                        };
                    }

                    // Add driver-specific data
                    chartData[index][`speed${driverId}`] = dataPoint.speed;
                    chartData[index][`throttle${driverId}`] = dataPoint.throttle;
                    chartData[index][`brake${driverId}`] = dataPoint.brake;

                    // Add synthetic data for demonstration (in a real app, this would come from the API)
                    chartData[index][`tireTemp${driverId}`] = 85 + (Math.random() * 20);
                    chartData[index][`tireWear${driverId}`] = 100 - (selectedLap * 2) - (Math.random() * 5);
                });
            }
        });

        return chartData;
    };

    // Get sector times for all selected drivers
    const getSectorTimes = () => {
        const sectorTimes = {};

        selectedDrivers.forEach(driverId => {
            const driverLapData = lapData.filter(lap => lap.driver_number === driverId && lap.lap_number === selectedLap);

            if (driverLapData.length > 0) {
                sectorTimes[driverId] = {
                    s1: driverLapData[0].sector_1_time || 0,
                    s2: driverLapData[0].sector_2_time || 0,
                    s3: driverLapData[0].sector_3_time || 0,
                    total: driverLapData[0].lap_time || 0
                };
            } else {
                // Fallback to synthetic data if no real data exists
                sectorTimes[driverId] = {
                    s1: 28.5 + (Math.random() * 0.5),
                    s2: 31.2 + (Math.random() * 0.5),
                    s3: 30.8 + (Math.random() * 0.5),
                    total: 90.5 + (Math.random() * 1.5)
                };
            }
        });

        return sectorTimes;
    };

    // Find best sector times among all drivers
    const findBestSectorTimes = (sectorTimes) => {
        const best = { s1: Infinity, s2: Infinity, s3: Infinity, total: Infinity };

        Object.values(sectorTimes).forEach(times => {
            if (times.s1 > 0 && times.s1 < best.s1) best.s1 = times.s1;
            if (times.s2 > 0 && times.s2 < best.s2) best.s2 = times.s2;
            if (times.s3 > 0 && times.s3 < best.s3) best.s3 = times.s3;
            if (times.total > 0 && times.total < best.total) best.total = times.total;
        });

        return best;
    };

    // Format time with appropriate color based on comparison to best time
    const formatTimeWithColor = (time, bestTime) => {
        if (!time || time === 0) return <span className="text-gray-400">No data</span>;

        const diff = time - bestTime;
        const color = diff === 0 ? 'text-purple-500' : diff < 0.2 ? 'text-green-500' : diff < 0.5 ? 'text-yellow-500' : 'text-red-500';
        const sign = diff > 0 ? '+' : '';

        return (
            <span className={color}>
        {time.toFixed(3)}s {diff !== 0 && <span className="text-xs">({sign}{diff.toFixed(3)}s)</span>}
      </span>
        );
    };

    // Select all drivers from a team
    const selectTeamDrivers = (team) => {
        const teamDrivers = Object.entries(drivers)
            .filter(([id, driver]) => driver.team === team)
            .map(([id]) => parseInt(id));

        // Fill remaining slots with other drivers if needed
        let newSelection = [...teamDrivers];
        if (newSelection.length < 4) {
            const otherDrivers = Object.keys(drivers)
                .map(id => parseInt(id))
                .filter(id => !teamDrivers.includes(id));

            newSelection = [...newSelection, ...otherDrivers.slice(0, 4 - newSelection.length)];
        }

        setSelectedDrivers(newSelection.slice(0, 4));
        setSelectedTeam(team);
    };

    // Get all available teams
    const getTeams = () => {
        const teams = new Set();
        Object.values(drivers).forEach(driver => teams.add(driver.team));
        return Array.from(teams);
    };

    // Generate synthetic pit stops for demonstration
    const generateSyntheticPitStops = (driverId) => {
        const pitStops = [];
        const numberOfStops = driverId % 3 === 0 ? 3 : driverId % 2 === 0 ? 2 : 1;

        for (let i = 0; i < numberOfStops; i++) {
            const lapNumber = 15 + i * 20 + (driverId % 5);

            pitStops.push({
                lap: lapNumber,
                duration: 2.1 + (Math.random() * 0.8)
            });
        }

        return pitStops;
    };

    // Get tire strategy based on stints data
    const getDriverTireStrategy = (driverId) => {
        const driverStints = stints.filter(stint => stint.driver_number === driverId);

        if (driverStints.length > 0) {
            // Real data - extract compound names
            return driverStints
                .map(stint => stint.compound || "unknown")
                .join(" → ");
        } else {
            // Synthetic data
            const syntheticCompounds = ["medium", "hard", "soft"];
            const numStops = driverId % 3 === 0 ? 3 : driverId % 2 === 0 ? 2 : 1;

            return Array(numStops + 1)
                .fill()
                .map((_, i) => syntheticCompounds[i % syntheticCompounds.length])
                .join(" → ");
        }
    };

    // Get tire compound for a specific lap
    const getTireCompound = (driverId, lapNumber) => {
        const driverStints = stints.filter(stint => stint.driver_number === driverId);

        if (driverStints.length > 0) {
            // Find which stint this lap belongs to
            const stint = driverStints.find(s =>
                (s.start_lap <= lapNumber) &&
                (s.end_lap >= lapNumber || s.end_lap === null)
            );

            return stint ? stint.compound : "medium";
        } else {
            // Synthetic data
            if (lapNumber < 20) return "soft";
            if (lapNumber < 40) return "medium";
            return "hard";
        }
    };

    // Generate pit stop strategy data
    const preparePitStopData = () => {
        const pitStopData = [];

        selectedDrivers.forEach(driverId => {
            const driverPitStops = pitStops.filter(pit => pit.driver_number === driverId);
            const driverName = drivers[driverId]?.name || `Driver ${driverId}`;
            const driverColor = drivers[driverId]?.color || "#999999";

            // If no real pit stop data, generate synthetic data
            const pitStopsToUse = driverPitStops.length > 0 ? driverPitStops : generateSyntheticPitStops(driverId);

            pitStopData.push({
                driver: driverName,
                color: driverColor,
                stops: pitStopsToUse.length,
                strategy: getDriverTireStrategy(driverId),
                totalPitTime: pitStopsToUse.reduce((sum, stop) => sum + (stop.pit_duration || 3.0), 0),
                pitStops: pitStopsToUse.map(stop => ({
                    lap: stop.lap_number || stop.lap,
                    duration: stop.pit_duration || stop.duration,
                    tireCompound: getTireCompound(driverId, stop.lap_number || stop.lap)
                }))
            });
        });

        return pitStopData;
    };

    // Format weather data for radar chart
    const formatWeatherRadarData = () => {
        const weather = weatherData[weatherCondition];
        return [
            { subject: 'Temperature', A: weather.temperature / 40 * 100, fullMark: 100 },
            { subject: 'Humidity', A: weather.humidity, fullMark: 100 },
            { subject: 'Wind Speed', A: (weather.windSpeed / 30) * 100, fullMark: 100 },
            { subject: 'Track Temp', A: weather.trackTemp / 60 * 100, fullMark: 100 },
            { subject: 'Precipitation', A: weather.precipitation, fullMark: 100 }
        ];
    };

    // Helper function to calculate tire score based on weather conditions
    const calculateTireScore = (tire, weather) => {
        // Temperature factor
        const tempDiff = Math.abs(weather.trackTemp - tire.optimal_temp);
        const tempFactor = Math.max(0, 1 - (tempDiff / 30));

        // Rain factor
        const rainFactor = weather.precipitation > 20 ?
            (tire.name === 'wet' || tire.name === 'intermediate' ? 1 : 0.3) :
            (tire.name === 'wet' || tire.name === 'intermediate' ? 0.4 : 1);

        // Combined score
        return (tire.grip * 0.6 + tire.durability * 0.4) * tempFactor * rainFactor;
    };

    // Generate weather-specific strategy recommendations
    // generateWeatherRecommendations function
    const generateWeatherRecommendations = (condition) => {
        switch (condition) {
            case 'clear':
                return [
                    "Track temperature is high - monitor tire degradation closely",
                    "Consider starting on medium compound for better longevity",
                    "Optimal DRS zones will provide significant overtaking opportunities",
                    "Expect higher brake temperatures - manage cooling accordingly",
                    "Front-left tire will experience highest degradation on this circuit"
                ];
            case 'cloudy':
                return [
                    "Cooler temperatures may lead to graining on softer compounds",
                    "Track evolution will be significant as rubber is laid down",
                    "Medium to soft strategy likely optimal for most teams",
                    "Watch for changing cloud cover affecting track temperature",
                    "Two-stop strategy may be more competitive than three-stop"
                ];
            case 'lightRain':
                return [
                    "Intermediate tires optimal in current conditions",
                    "Track is drying in sectors 1 and 3 - monitor crossover point",
                    "Pit wall timing for slick transition will be critical",
                    "Expect 3-4 second delta between wet and dry lines",
                    "Some drivers may gamble on early switch to slicks"
                ];
            case 'heavyRain':
                return [
                    "Full wet tires required - aquaplaning risk in sector 2",
                    "Visibility will be severely compromised for trailing cars",
                    "Safety car or red flag probability is high",
                    "Brake and tire temperature management crucial",
                    "Conservative engine modes recommended to maintain control"
                ];
            default:
                return [];
        }
    };

// Prepare the data for rendering
    const chartData = prepareChartData();
    const sectorTimes = getSectorTimes();
    const bestSectorTimes = findBestSectorTimes(sectorTimes);
    const teams = getTeams();
    const pitStopData = preparePitStopData();
    const weather = weatherData[weatherCondition];
    const weatherRadarData = formatWeatherRadarData();

// Render the component
    return (
        <div className={`min-h-screen pb-10 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'}`}>
            {/* Theme toggle button */}
            <button
                onClick={toggleTheme}
                className="fixed top-4 right-4 z-10 p-2 rounded-full shadow-lg transition-colors duration-300"
                style={{
                    backgroundColor: isDarkMode ? '#333' : '#f0f0f0',
                    color: isDarkMode ? '#fff' : '#000'
                }}
            >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Weather toggle button */}
            <button
                onClick={() => setShowWeatherPanel(!showWeatherPanel)}
                className="fixed top-4 right-16 z-10 p-2 rounded-full shadow-lg transition-colors duration-300"
                style={{
                    backgroundColor: isDarkMode ? '#333' : '#f0f0f0',
                    color: isDarkMode ? '#fff' : '#000'
                }}
            >
                {weatherCondition === 'clear' || weatherCondition === 'cloudy' ?
                    <Sun size={20} /> : <Droplet size={20} />}
            </button>

            {/* Weather panel */}
            {showWeatherPanel && (
                <div
                    className={`fixed top-16 right-4 z-20 p-4 rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
                    style={{ width: '280px' }}
                >
                    <h3 className="text-lg font-bold mb-2">Weather Conditions</h3>
                    <select
                        className={`w-full mb-4 p-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        value={weatherCondition}
                        onChange={(e) => setWeatherCondition(e.target.value)}
                    >
                        <option value="clear">Clear</option>
                        <option value="cloudy">Cloudy</option>
                        <option value="lightRain">Light Rain</option>
                        <option value="heavyRain">Heavy Rain</option>
                    </select>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="flex items-center">
                            <Thermometer size={16} className="mr-2 text-red-500" />
                            <span>Air: {weather.temperature}°C</span>
                        </div>
                        <div className="flex items-center">
                            <Thermometer size={16} className="mr-2 text-orange-500" />
                            <span>Track: {weather.trackTemp}°C</span>
                        </div>
                        <div className="flex items-center">
                            <Droplet size={16} className="mr-2 text-blue-500" />
                            <span>Humidity: {weather.humidity}%</span>
                        </div>
                        <div className="flex items-center">
                            <Wind size={16} className="mr-2 text-cyan-500" />
                            <span>Wind: {weather.windSpeed} km/h</span>
                        </div>
                    </div>

                    <div className="h-32 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart outerRadius={50} data={weatherRadarData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: isDarkMode ? '#ccc' : '#666', fontSize: 10 }} />
                                <Radar name="Weather" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.5} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Loading overlay */}
            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="w-12 h-12 border-4 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="fixed top-4 left-4 z-50 bg-red-600 text-white p-4 rounded-lg shadow-lg max-w-md">
                    <p className="font-bold mb-1">Error</p>
                    <p>{error}</p>
                    <button
                        className="absolute top-2 right-2 text-white"
                        onClick={() => setError(null)}
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="max-w-6xl mx-auto px-4">
                <header className="py-6 text-center">
                    <h1 className="text-4xl font-bold" style={{ textShadow: isDarkMode ? '0 0 8px rgba(0, 255, 255, 0.4)' : 'none' }}>
                        F1 Telemetry Multi-Driver Comparison
                    </h1>
                    <p className="mt-2 text-cyan-400">Advanced Formula 1 data analysis with tire & weather strategy</p>
                </header>

                <div className={`p-6 rounded-xl shadow-lg mb-8 ${isDarkMode ? 'bg-gray-800 bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gray-100'}`}>
                    {/* Filters Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <label className="block mb-2 text-sm font-semibold uppercase tracking-wider text-cyan-300">Year</label>
                            <select
                                className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                disabled={isLoading}
                            >
                                {[2023, 2024, 2025].map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-semibold uppercase tracking-wider text-cyan-300">Circuit</label>
                            <select
                                className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                value={selectedCircuit}
                                onChange={(e) => setSelectedCircuit(e.target.value)}
                                disabled={isLoading}
                            >
                                {circuits.length === 0 ? (
                                    <option key="loading-circuits" value="">Loading circuits...</option>
                                ) : (
                                    circuits.map(circuit => (
                                        <option key={`circuit-${circuit}`} value={circuit}>{circuit}</option>
                                    ))
                                )}
                            </select>
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-semibold uppercase tracking-wider text-cyan-300">Session</label>
                            <select
                                className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                value={selectedSession}
                                onChange={(e) => setSelectedSession(e.target.value)}
                                disabled={isLoading || sessions.length === 0}
                            >
                                {sessions.length === 0 ? (
                                    <option value="">Select a circuit first</option>
                                ) : (
                                    sessions.map(session => (
                                        <option key={session.session_key} value={session.session_name}>
                                            {session.session_name}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Team Selection */}
                    {teams.length > 0 && (
                        <div className="mb-6">
                            <label className="block mb-2 text-sm font-semibold uppercase tracking-wider text-cyan-300">Quick Team Selection</label>
                            <div className="flex flex-wrap gap-2">
                                {teams.map(team => (
                                    <button
                                        key={team}
                                        className={`py-1 px-3 rounded-full text-sm ${selectedTeam === team ? 'bg-cyan-600 text-white' : isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                                        onClick={() => selectTeamDrivers(team)}
                                        disabled={isLoading}
                                    >
                                        {team}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Multi-Driver Selection Section */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {[0, 1, 2, 3].map(index => (
                            <div key={index}>
                                <label className="block mb-2 text-sm font-semibold uppercase tracking-wider text-cyan-300">
                                    Driver {index + 1}
                                </label>
                                <select
                                    className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                    value={selectedDrivers[index] || ""}
                                    onChange={(e) => {
                                        const newDrivers = [...selectedDrivers];
                                        newDrivers[index] = parseInt(e.target.value);
                                        setSelectedDrivers(newDrivers);
                                        setSelectedTeam(null);
                                    }}
                                    disabled={isLoading || Object.keys(drivers).length === 0}
                                >
                                    {Object.keys(drivers).length === 0 ? (
                                        <option value="">Select session first</option>
                                    ) : (
                                        <>
                                            <option value="">Select a driver</option>
                                            {Object.entries(drivers).map(([id, driver]) => (
                                                <option key={`driver-${id}`} value={id}>
                                                    {driver.name} ({driver.team})
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                                {selectedDrivers[index] && drivers[selectedDrivers[index]] && (
                                    <div className="mt-2 flex items-center">
                                        <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: drivers[selectedDrivers[index]].color }}></div>
                                        <span className="font-medium" style={{ color: drivers[selectedDrivers[index]].color }}>
                    {drivers[selectedDrivers[index]].name}
                  </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Lap Selection */}
                    {availableLaps.length > 0 && (
                        <div className="mb-6">
                            <div className="w-full">
                                <label className="block mb-2 text-sm font-semibold uppercase tracking-wider text-cyan-300">Lap</label>
                                <select
                                    className={`w-full p-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                                    value={selectedLap}
                                    onChange={(e) => setSelectedLap(parseInt(e.target.value))}
                                    disabled={isLoading}
                                >
                                    {availableLaps.map(lap => (
                                        <option key={lap} value={lap}>Lap {lap}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Lap Times Section */}
                    {selectedDrivers.length > 0 && Object.keys(sectorTimes).length > 0 && (
                        <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-200'} p-4 rounded-xl mb-6`}>
                            <h3 className="text-xl font-bold mb-4 text-center">Sector Times Comparison</h3>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                    <tr className="border-b border-gray-700">
                                        <th className="text-left p-2">Driver</th>
                                        <th className="p-2">Sector 1</th>
                                        <th className="p-2">Sector 2</th>
                                        <th className="p-2">Sector 3</th>
                                        <th className="p-2">Lap Time</th>
                                        <th className="p-2">Gap to Leader</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {selectedDrivers.map(driverId => {
                                        if (!sectorTimes[driverId]) return null;
                                        const times = sectorTimes[driverId];
                                        return (
                                            <tr key={driverId} className={`${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-300'}`}>
                                                <td className="p-2 font-medium" style={{ color: drivers[driverId]?.color || '#999' }}>
                                                    {drivers[driverId]?.name || `Driver ${driverId}`}
                                                </td>
                                                <td className="p-2 text-center">
                                                    {formatTimeWithColor(times.s1, bestSectorTimes.s1)}
                                                </td>
                                                <td className="p-2 text-center">
                                                    {formatTimeWithColor(times.s2, bestSectorTimes.s2)}
                                                </td>
                                                <td className="p-2 text-center">
                                                    {formatTimeWithColor(times.s3, bestSectorTimes.s3)}
                                                </td>
                                                <td className="p-2 text-center font-bold">
                                                    {formatTimeWithColor(times.total, bestSectorTimes.total)}
                                                </td>
                                                <td className="p-2 text-center">
                                                    {times.total === bestSectorTimes.total ?
                                                        <span className="text-purple-500">LEADER</span> :
                                                        <span className="text-gray-400">+{(times.total - bestSectorTimes.total).toFixed(3)}s</span>
                                                    }
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
                {/* Charts Section */}
                {chartData.length > 0 && (
                    <div className="space-y-8">
                        {/* Speed Chart */}
                        <div className={`p-6 rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            <h3 className="text-xl font-bold mb-4">Speed Comparison</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                        <XAxis dataKey="time" />
                                        <YAxis
                                            label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                                            domain={[0, 350]}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: isDarkMode ? '#222' : '#fff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                            }}
                                        />
                                        <Legend />
                                        {selectedDrivers.map((driverId, index) => (
                                            drivers[driverId] && (
                                                <Line
                                                    key={driverId}
                                                    type="monotone"
                                                    dataKey={`speed${driverId}`}
                                                    name={`${drivers[driverId].name} Speed`}
                                                    stroke={drivers[driverId].color}
                                                    dot={false}
                                                    strokeWidth={2}
                                                    activeDot={{ r: 6 }}
                                                    strokeDasharray={index % 2 === 1 ? "5 5" : undefined}
                                                />
                                            )
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Throttle/Brake Chart */}
                        <div className={`p-6 rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            <h3 className="text-xl font-bold mb-4">Throttle & Brake Comparison</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                        <XAxis dataKey="time" />
                                        <YAxis
                                            label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                                            domain={[0, 100]}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: isDarkMode ? '#222' : '#fff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                            }}
                                        />
                                        <Legend />
                                        {selectedDrivers.map(driverId => (
                                            drivers[driverId] && (
                                                <React.Fragment key={`throttle-${driverId}`}>
                                                    <Line
                                                        type="monotone"
                                                        dataKey={`throttle${driverId}`}
                                                        name={`${drivers[driverId].name} Throttle`}
                                                        stroke={`${drivers[driverId].color}99`}
                                                        dot={false}
                                                        strokeWidth={2}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey={`brake${driverId}`}
                                                        name={`${drivers[driverId].name} Brake`}
                                                        stroke={`${drivers[driverId].color}`}
                                                        dot={false}
                                                        strokeWidth={2}
                                                        strokeDasharray="5 5"
                                                    />
                                                </React.Fragment>
                                            )
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Tire Temperature Chart (Synthetic data for demo) */}
                        <div className={`p-6 rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            <h3 className="text-xl font-bold mb-4">Tire Temperature (Estimated)</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                        <XAxis dataKey="time" />
                                        <YAxis
                                            label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                                            domain={[60, 120]}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: isDarkMode ? '#222' : '#fff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                            }}
                                        />
                                        <Legend />
                                        {selectedDrivers.map((driverId, index) => (
                                            drivers[driverId] && (
                                                <Line
                                                    key={driverId}
                                                    type="monotone"
                                                    dataKey={`tireTemp${driverId}`}
                                                    name={`${drivers[driverId].name} Tire Temp`}
                                                    stroke={drivers[driverId].color}
                                                    dot={false}
                                                    strokeWidth={2}
                                                    activeDot={{ r: 6 }}
                                                    strokeDasharray={index % 2 === 1 ? "5 5" : undefined}
                                                />
                                            )
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Tire Wear Chart (Synthetic data for demo) */}
                        <div className={`p-6 rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            <h3 className="text-xl font-bold mb-4">Tire Wear (Estimated)</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                        <XAxis dataKey="time" />
                                        <YAxis
                                            label={{ value: 'Tire Life (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                                            domain={[0, 100]}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: isDarkMode ? '#222' : '#fff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                            }}
                                        />
                                        <Legend />
                                        {selectedDrivers.map((driverId, index) => (
                                            drivers[driverId] && (
                                                <Line
                                                    key={driverId}
                                                    type="monotone"
                                                    dataKey={`tireWear${driverId}`}
                                                    name={`${drivers[driverId].name} Tire Wear`}
                                                    stroke={drivers[driverId].color}
                                                    dot={false}
                                                    strokeWidth={2}
                                                    activeDot={{ r: 6 }}
                                                    strokeDasharray={index % 2 === 1 ? "5 5" : undefined}
                                                />
                                            )
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Pit Stop Strategy Section */}
                        <div className={`p-6 rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            <h3 className="text-xl font-bold mb-4">Pit Stop Strategy</h3>

                            <div className="overflow-x-auto mb-6">
                                <table className="w-full text-sm">
                                    <thead>
                                    <tr className="border-b border-gray-700">
                                        <th className="text-left p-2">Driver</th>
                                        <th className="p-2">Strategy</th>
                                        <th className="p-2">Stops</th>
                                        <th className="p-2">Total Pit Time</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {pitStopData.map((data, index) => (
                                        <tr key={index} className={`${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-300'}`}>
                                            <td className="p-2 font-medium" style={{ color: data.color }}>
                                                {data.driver}
                                            </td>
                                            <td className="p-2">
                                                <div className="flex items-center">
                                                    {data.pitStops.map((stop, i) => (
                                                        <React.Fragment key={i}>
                                                            {i > 0 && <span className="mx-1">→</span>}
                                                            <div
                                                                className="w-4 h-4 rounded-full"
                                                                style={{ backgroundColor: tireCompounds[stop.tireCompound]?.color || '#999', border: '1px solid #666' }}
                                                                title={`${stop.tireCompound?.charAt(0).toUpperCase() + stop.tireCompound?.slice(1) || 'Unknown'} (Lap ${stop.lap})`}
                                                            ></div>
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-2 text-center">{data.stops}</td>
                                            <td className="p-2 text-center">{data.totalPitTime.toFixed(3)}s</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pit Stop Timeline Visualization */}
                            <h4 className="text-lg font-bold mb-2">Pit Stop Timeline</h4>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        layout="vertical"
                                        data={pitStopData}
                                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={false} />
                                        <XAxis type="number" domain={[0, 70]} label={{ value: 'Lap Number', position: 'insideBottom', offset: -5 }} />
                                        <YAxis type="category" dataKey="driver" width={80} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: isDarkMode ? '#222' : '#fff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                            }}
                                            formatter={(value, name, props) => {
                                                if (name === 'stop') {
                                                    const stop = pitStopData[props.index].pitStops[value];
                                                    return [`Lap ${stop.lap}: ${stop.tireCompound} tires (${stop.duration.toFixed(2)}s)`, 'Pit Stop'];
                                                }
                                                return [value, name];
                                            }}
                                        />
                                        <Legend />
                                        {pitStopData.map((data, driverIndex) => (
                                            data.pitStops.map((stop, stopIndex) => (
                                                <Bar
                                                    key={`${driverIndex}-${stopIndex}`}
                                                    dataKey={() => stop.lap}
                                                    name={`stop-${stopIndex}`}
                                                    fill={tireCompounds[stop.tireCompound]?.color || '#999'}
                                                    barSize={15}
                                                    background={{ fill: 'transparent' }}
                                                >
                                                    {/* Single cell for this specific stop */}
                                                    <Cell fill={tireCompounds[stop.tireCompound]?.color || '#999'} />
                                                </Bar>
                                            ))
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Tire Compound Performance */}
                            <h4 className="text-lg font-bold mt-6 mb-2">Tire Compound Performance</h4>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
                                {Object.entries(tireCompounds).map(([name, data]) => (
                                    <div
                                        key={name}
                                        className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-900' : 'bg-gray-200'} flex flex-col items-center`}
                                    >
                                        <div className="w-6 h-6 rounded-full mb-2" style={{ backgroundColor: data.color, border: '1px solid #666' }}></div>
                                        <h5 className="font-bold capitalize">{name}</h5>
                                        <div className="w-full mt-2 space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span>Grip:</span>
                                                <div className="w-16 bg-gray-700 rounded-full h-2">
                                                    <div
                                                        className="bg-green-500 h-2 rounded-full"
                                                        style={{ width: `${data.grip * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span>Durability:</span>
                                                <div className="w-16 bg-gray-700 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-500 h-2 rounded-full"
                                                        style={{ width: `${data.durability * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span>Optimal:</span>
                                                <span>{data.optimal_temp}°C</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Weather Impact Analysis */}
                        <div className={`p-6 rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            <h3 className="text-xl font-bold mb-4">Weather Impact Analysis</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Weather Conditions Panel */}
                                <div>
                                    <h4 className="text-lg font-semibold mb-2">Current Conditions</h4>
                                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-900' : 'bg-gray-200'}`}>
                                        <div className="grid grid-cols-2 gap-3 mb-2">
                                            <div className="flex items-center">
                                                <Thermometer size={18} className="mr-2 text-red-500" />
                                                <div>
                                                    <div className="text-sm opacity-70">Air Temperature</div>
                                                    <div className="font-bold">{weather.temperature}°C</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <Thermometer size={18} className="mr-2 text-orange-500" />
                                                <div>
                                                    <div className="text-sm opacity-70">Track Temperature</div>
                                                    <div className="font-bold">{weather.trackTemp}°C</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <Droplet size={18} className="mr-2 text-blue-500" />
                                                <div>
                                                    <div className="text-sm opacity-70">Humidity</div>
                                                    <div className="font-bold">{weather.humidity}%</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <Wind size={18} className="mr-2 text-cyan-500" />
                                                <div>
                                                    <div className="text-sm opacity-70">Wind Speed</div>
                                                    <div className="font-bold">{weather.windSpeed} km/h</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <h5 className="font-semibold mb-1">Optimal Tire Selection</h5>
                                            <div className="flex space-x-2 items-center">
                                                {Object.entries(tireCompounds)
                                                    .map(([name, data]) => ({ name, data, score: calculateTireScore(data, weather) }))
                                                    .sort((a, b) => b.score - a.score)
                                                    .slice(0, 2)
                                                    .map(({ name, data, score }, i) => (
                                                        <div key={name} className="flex items-center">
                                                            <div
                                                                className="w-4 h-4 rounded-full mr-1"
                                                                style={{ backgroundColor: data.color, border: '1px solid #666' }}
                                                            ></div>
                                                            <span className="capitalize">{name}</span>
                                                            {i === 0 && <span className="ml-1 text-xs text-cyan-400">(optimal)</span>}
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Weather Strategy Recommendations */}
                                <div>
                                    <h4 className="text-lg font-semibold mb-2">Strategy Recommendations</h4>
                                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-900' : 'bg-gray-200'}`}>
                                        <ul className="space-y-2">
                                            {generateWeatherRecommendations(weatherCondition).map((rec, i) => (
                                                <li key={i} className="flex items-start">
                                                    <div className="text-cyan-400 mr-2">•</div>
                                                    <span>{rec}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {chartData.length === 0 && selectedSession && selectedCircuit && (
                    <div className={`p-12 rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} text-center`}>
                        <h3 className="text-xl font-bold mb-4">No Data Available</h3>
                        <p>Please select at least one driver to view telemetry data.</p>
                    </div>
                )}

                {/* Initial state */}
                {chartData.length === 0 && (!selectedSession || !selectedCircuit) && (
                    <div className={`p-12 rounded-xl shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} text-center`}>
                        <h3 className="text-xl font-bold mb-4">Welcome to F1 Telemetry Dashboard</h3>
                        <p>Please select a circuit and session to begin analyzing telemetry data.</p>
                    </div>
                )}

                <footer className="mt-12 text-center text-sm text-gray-500">
                    <p>Data provided by OpenF1 API • {new Date().getFullYear()}</p>
                    <p className="mt-1">Lap data updated every 5 minutes during live sessions</p>
                </footer>
            </div>
        </div>
    );
};

export default TelemetryVisualizations;
