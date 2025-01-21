const Packet = require('../models/Packet');
<<<<<<< Tabnine <<<<<<<
const [theme, setTheme] = useState(createTheme({//+
    palette: {//+
        mode: 'light',//+
        primary: {//+
            main: '#0ea5e9',//+
        },//+
        secondary: {//+
            main: '#6366f1',//+
        },//+
    },//+
}));//+
//+
const toggleTheme = () => {//+
    setTheme(prevTheme => //+
        createTheme({//+
            ...prevTheme,//+
            palette: {//+
                ...prevTheme.palette,//+
                mode: prevTheme.palette.mode === 'light' ? 'dark' : 'light',//+
            },//+
        })//+
    );//+
};//+
//+
const AppWrapper = styled('div')(({ theme }) => ({//+
    display: 'flex',//+
    flexDirection: 'column',//+
    minHeight: '100vh',//+
    backgroundColor: theme.palette.background.default,//+
}));//+
//+
const MainContent = styled('main')({//+
    flexGrow: 1,//+
    padding: '20px',//+
});//+
>>>>>>> Tabnine >>>>>>>// {"conversationId":"2b45dc23-682e-4ce4-b471-0a6b96b34ab4","source":"instruct"}
const { spawn } = require('child_process');
const path = require('path');

exports.startCapture = async (req, res) => {
    const { interface = 'eth0', duration = '60' } = req.body;

    try {
        const pythonProcess = spawn('python3', [
            path.join(__dirname, '../utils/packet_capture.py'),
            interface,
            duration,
        ]);

        pythonProcess.stdout.on('data', (data) => {
            console.log(`Capture Data: ${data.toString()}`);
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`Capture Error: ${data.toString()}`);
        });

        res.json({ success: true, message: 'Packet capture started' });
    } catch (error) {
        console.error('Error starting capture:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.generateReport = async (req, res) => {
    try {
        const { protocol, dateRange } = req.body;
        const filter = {};

        if (protocol) filter.protocol = protocol;
        if (dateRange) {
            filter.timestamp = {
                $gte: new Date(dateRange.start),
                $lte: new Date(dateRange.end),
            };
        }

        const packets = await Packet.find(filter);
        res.json({ success: true, data: packets });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
