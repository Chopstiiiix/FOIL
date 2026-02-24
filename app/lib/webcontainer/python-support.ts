import type { WebContainer } from '@webcontainer/api';

// Python template files for different project types
export const pythonTemplates = {
  streamlit: {
    'app.py': `import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px

st.set_page_config(page_title="FOIL Dashboard", layout="wide")

st.title("📊 Interactive Dashboard")
st.markdown("Built with Streamlit in FOIL")

# Sample data
@st.cache_data
def load_data():
    dates = pd.date_range('2024-01-01', periods=100)
    df = pd.DataFrame({
        'date': dates,
        'sales': np.random.randn(100).cumsum() + 100,
        'profit': np.random.randn(100).cumsum() + 50,
        'customers': np.random.randint(50, 200, 100)
    })
    return df

df = load_data()

# Sidebar
with st.sidebar:
    st.header("Filters")
    date_range = st.date_input(
        "Select Date Range",
        value=(df['date'].min(), df['date'].max()),
        min_value=df['date'].min(),
        max_value=df['date'].max()
    )

    metric = st.selectbox(
        "Select Metric",
        options=['sales', 'profit', 'customers']
    )

# Main content
col1, col2, col3 = st.columns(3)

with col1:
    st.metric("Total Sales", f"${df['sales'].sum():,.2f}", "+12%")
with col2:
    st.metric("Total Profit", f"${df['profit'].sum():,.2f}", "+8%")
with col3:
    st.metric("Total Customers", f"{df['customers'].sum():,}", "+15%")

# Charts
st.subheader(f"📈 {metric.title()} Trend")
fig = px.line(df, x='date', y=metric, title=f'{metric.title()} Over Time')
st.plotly_chart(fig, use_container_width=True)

# Data table
st.subheader("📋 Raw Data")
st.dataframe(df, use_container_width=True)
`,
    'requirements.txt': `streamlit
pandas
numpy
plotly
`,
    'run.sh': `#!/bin/bash
pip install -r requirements.txt
streamlit run app.py --server.port=3000 --server.address=0.0.0.0
`,
  },

  dash: {
    'app.py': `from dash import Dash, html, dcc, callback, Output, Input
import plotly.express as px
import pandas as pd
import numpy as np

# Initialize the app
app = Dash(__name__)

# Generate sample data
dates = pd.date_range('2024-01-01', periods=100)
df = pd.DataFrame({
    'date': dates,
    'sales': np.random.randn(100).cumsum() + 100,
    'profit': np.random.randn(100).cumsum() + 50,
    'customers': np.random.randint(50, 200, 100)
})

# Define the layout
app.layout = html.Div([
    html.Div(className='header', children=[
        html.H1('FOIL Analytics Dashboard'),
        html.P('Interactive dashboard built with Dash and Plotly')
    ], style={'textAlign': 'center', 'padding': '20px', 'backgroundColor': '#1a1a2e', 'color': 'white'}),

    html.Div([
        html.Div([
            html.Label('Select Metric:', style={'fontWeight': 'bold'}),
            dcc.Dropdown(
                id='metric-dropdown',
                options=[
                    {'label': 'Sales', 'value': 'sales'},
                    {'label': 'Profit', 'value': 'profit'},
                    {'label': 'Customers', 'value': 'customers'}
                ],
                value='sales',
                style={'width': '200px'}
            )
        ], style={'padding': '20px'}),

        html.Div([
            html.Div(id='metric-card', style={
                'backgroundColor': '#f0f0f0',
                'padding': '20px',
                'borderRadius': '10px',
                'margin': '20px',
                'textAlign': 'center'
            }),

            dcc.Graph(id='trend-chart'),

            html.Div([
                html.H3('Data Table'),
                html.Div(id='data-table')
            ], style={'padding': '20px'})
        ])
    ])
])

# Callbacks
@callback(
    [Output('metric-card', 'children'),
     Output('trend-chart', 'figure')],
    Input('metric-dropdown', 'value')
)
def update_dashboard(selected_metric):
    total = df[selected_metric].sum()

    card_content = [
        html.H2(f'Total {selected_metric.title()}'),
        html.H1(f'${total:,.2f}' if selected_metric != 'customers' else f'{int(total):,}')
    ]

    fig = px.line(df, x='date', y=selected_metric,
                  title=f'{selected_metric.title()} Over Time',
                  template='plotly_dark')

    return card_content, fig

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=3000)
`,
    'requirements.txt': `dash
plotly
pandas
numpy
`,
    'run.sh': `#!/bin/bash
pip install -r requirements.txt
python app.py
`,
  },

  fastapi: {
    'main.py': `from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import datetime

app = FastAPI(title="FOIL API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class Item(BaseModel):
    id: Optional[int] = None
    title: str
    description: Optional[str] = None
    price: float
    created_at: Optional[datetime.datetime] = None

# In-memory database
items_db = []
counter = 1

@app.get("/")
def root():
    return {
        "message": "Welcome to FOIL FastAPI",
        "endpoints": {
            "docs": "/docs",
            "items": "/items",
            "health": "/health"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.datetime.now()}

@app.get("/items", response_model=List[Item])
def get_items(skip: int = 0, limit: int = 10):
    return items_db[skip : skip + limit]

@app.get("/items/{item_id}", response_model=Item)
def get_item(item_id: int):
    for item in items_db:
        if item.id == item_id:
            return item
    raise HTTPException(status_code=404, detail="Item not found")

@app.post("/items", response_model=Item)
def create_item(item: Item):
    global counter
    item.id = counter
    item.created_at = datetime.datetime.now()
    counter += 1
    items_db.append(item)
    return item

@app.put("/items/{item_id}", response_model=Item)
def update_item(item_id: int, item: Item):
    for idx, existing_item in enumerate(items_db):
        if existing_item.id == item_id:
            item.id = item_id
            item.created_at = existing_item.created_at
            items_db[idx] = item
            return item
    raise HTTPException(status_code=404, detail="Item not found")

@app.delete("/items/{item_id}")
def delete_item(item_id: int):
    for idx, item in enumerate(items_db):
        if item.id == item_id:
            del items_db[idx]
            return {"message": "Item deleted successfully"}
    raise HTTPException(status_code=404, detail="Item not found")
`,
    'requirements.txt': `fastapi
uvicorn
pydantic
python-multipart
`,
    'run.sh': `#!/bin/bash
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 3000
`,
  },

  jupyter: {
    'notebook.ipynb': `{
  "cells": [
    {
      "cell_type": "markdown",
      "metadata": {},
      "source": [
        "# FOIL Data Analysis Notebook\\n",
        "Interactive Jupyter notebook for data analysis and visualization"
      ]
    },
    {
      "cell_type": "code",
      "execution_count": null,
      "metadata": {},
      "outputs": [],
      "source": [
        "import pandas as pd\\n",
        "import numpy as np\\n",
        "import matplotlib.pyplot as plt\\n",
        "import seaborn as sns\\n",
        "\\n",
        "# Set style\\n",
        "sns.set_theme(style='darkgrid')\\n",
        "%matplotlib inline"
      ]
    },
    {
      "cell_type": "code",
      "execution_count": null,
      "metadata": {},
      "outputs": [],
      "source": [
        "# Generate sample data\\n",
        "np.random.seed(42)\\n",
        "data = {\\n",
        "    'date': pd.date_range('2024-01-01', periods=100),\\n",
        "    'sales': np.random.randn(100).cumsum() + 100,\\n",
        "    'profit': np.random.randn(100).cumsum() + 50,\\n",
        "    'customers': np.random.randint(50, 200, 100)\\n",
        "}\\n",
        "df = pd.DataFrame(data)\\n",
        "df.head()"
      ]
    },
    {
      "cell_type": "code",
      "execution_count": null,
      "metadata": {},
      "outputs": [],
      "source": [
        "# Create visualizations\\n",
        "fig, axes = plt.subplots(2, 2, figsize=(12, 8))\\n",
        "\\n",
        "# Sales trend\\n",
        "axes[0, 0].plot(df['date'], df['sales'])\\n",
        "axes[0, 0].set_title('Sales Trend')\\n",
        "axes[0, 0].set_xlabel('Date')\\n",
        "axes[0, 0].set_ylabel('Sales')\\n",
        "\\n",
        "# Profit trend\\n",
        "axes[0, 1].plot(df['date'], df['profit'], color='green')\\n",
        "axes[0, 1].set_title('Profit Trend')\\n",
        "axes[0, 1].set_xlabel('Date')\\n",
        "axes[0, 1].set_ylabel('Profit')\\n",
        "\\n",
        "# Customer distribution\\n",
        "axes[1, 0].hist(df['customers'], bins=20, edgecolor='black')\\n",
        "axes[1, 0].set_title('Customer Distribution')\\n",
        "axes[1, 0].set_xlabel('Number of Customers')\\n",
        "axes[1, 0].set_ylabel('Frequency')\\n",
        "\\n",
        "# Correlation heatmap\\n",
        "corr = df[['sales', 'profit', 'customers']].corr()\\n",
        "sns.heatmap(corr, annot=True, cmap='coolwarm', ax=axes[1, 1])\\n",
        "axes[1, 1].set_title('Correlation Matrix')\\n",
        "\\n",
        "plt.tight_layout()\\n",
        "plt.show()"
      ]
    }
  ],
  "metadata": {
    "kernelspec": {
      "display_name": "Python 3",
      "language": "python",
      "name": "python3"
    },
    "language_info": {
      "name": "python",
      "version": "3.9.0"
    }
  },
  "nbformat": 4,
  "nbformat_minor": 4
}`,
    'requirements.txt': `jupyter
pandas
numpy
matplotlib
seaborn
plotly
scikit-learn
`,
    'run.sh': `#!/bin/bash
pip install -r requirements.txt
jupyter notebook --ip=0.0.0.0 --port=3000 --no-browser --allow-root
`,
  },
};

// Function to set up Python environment in WebContainer
export async function setupPythonEnvironment(
  webcontainer: WebContainer,
  template: keyof typeof pythonTemplates = 'streamlit'
) {
  try {
    // Install Python via pyodide or system package
    await webcontainer.spawn('npm', ['install', '-g', 'pyodide']);

    // Create project files from template
    const projectFiles = pythonTemplates[template];

    for (const [filename, content] of Object.entries(projectFiles)) {
      await webcontainer.fs.writeFile(filename, content);
    }

    // Make run script executable
    await webcontainer.spawn('chmod', ['+x', 'run.sh']);

    return true;
  } catch (error) {
    console.error('Failed to setup Python environment:', error);
    return false;
  }
}

// Function to install Python packages
export async function installPythonPackages(
  webcontainer: WebContainer,
  packages: string[]
) {
  try {
    const packageList = packages.join(' ');
    const installProcess = await webcontainer.spawn('pip', ['install', ...packages]);

    return await installProcess.exit === 0;
  } catch (error) {
    console.error('Failed to install Python packages:', error);
    return false;
  }
}

// Function to run Python script
export async function runPythonScript(
  webcontainer: WebContainer,
  scriptPath: string,
  args: string[] = []
) {
  try {
    const pythonProcess = await webcontainer.spawn('python', [scriptPath, ...args]);

    pythonProcess.output.pipeTo(
      new WritableStream({
        write(chunk) {
          console.log('[Python Output]:', chunk);
        },
      })
    );

    return pythonProcess;
  } catch (error) {
    console.error('Failed to run Python script:', error);
    return null;
  }
}

// Export Python template categories
export const pythonProjectTypes = [
  { id: 'streamlit', name: 'Streamlit Dashboard', icon: '📊' },
  { id: 'dash', name: 'Plotly Dash App', icon: '📈' },
  { id: 'fastapi', name: 'FastAPI REST API', icon: '🚀' },
  { id: 'jupyter', name: 'Jupyter Notebook', icon: '📓' },
] as const;