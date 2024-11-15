import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

# Set seaborn style for better aesthetics
sns.set(style="whitegrid")

def load_csv(file_path):
    """
    Loads a CSV file into a pandas DataFrame with error handling.
    """
    try:
        data = pd.read_csv(file_path)
        print(f"Successfully loaded '{file_path}'.")
        return data
    except FileNotFoundError:
        print(f"Error: The file '{file_path}' was not found.")
        return None
    except pd.errors.EmptyDataError:
        print(f"Error: The file '{file_path}' is empty.")
        return None
    except pd.errors.ParserError:
        print(f"Error: The file '{file_path}' could not be parsed.")
        return None

def calculate_mean(data):
    """
    Calculates the mean for each numeric column in the DataFrame.
    Returns a Series containing the mean values.
    """
    # Select numeric columns only
    numeric_cols = data.select_dtypes(include=['number']).columns.tolist()
    
    # Calculate mean
    means = data[numeric_cols].mean()
    
    return means

def main():
    # Define file paths
    csv_files = {
        'Angular': './performance-angular.csv',
        'React': './performance-react.csv',
        'Vue': './performance-vue.csv'
    }
    
    # Define columns to exclude
    exclude_columns = ['DurationMs', 'Iteration', "voteDurationMs", "PollIndex"]
    
    # Load all CSV files into a dictionary of DataFrames
    dataframes = {}
    for name, path in csv_files.items():
        if os.path.exists(path):
            df = load_csv(path)
            if df is not None:
                # Optional: Standardize column names (strip whitespace)
                df.columns = [col.strip() for col in df.columns]
                dataframes[name] = df
        else:
            print(f"Warning: '{path}' does not exist and will be skipped.")
    
    # Check if at least two dataframes are loaded
    if len(dataframes) < 2:
        print("Error: Need at least two valid CSV files to compare.")
        return
    
    # Calculate mean for each DataFrame
    means_dict = {}
    for name, df in dataframes.items():
        means = calculate_mean(df)
        means_dict[name] = means
        print(f"\nMean Values for '{name}':")
        print(means)
    
    # Ensure all DataFrames have the same columns for comparison
    common_columns = set.intersection(*(set(means.index) for means in means_dict.values()))
    if not common_columns:
        print("Error: No common columns found across the CSV files.")
        return
    
    # Convert the set to a list and exclude specified columns
    common_columns = list(common_columns)
    for col in exclude_columns:
        if col in common_columns:
            common_columns.remove(col)
            print(f"Excluded column '{col}' from analysis.")
    
    if not common_columns:
        print("Error: No columns left to analyze after excluding specified columns.")
        return
    
    # Filter means to include only common and non-excluded columns
    for name in means_dict:
        means_dict[name] = means_dict[name].loc[common_columns]
    
    # Combine means into a single DataFrame
    combined_means_df = pd.DataFrame(means_dict)
    
    # Transpose for plotting (Files as rows, Headers as columns)
    combined_means_df = combined_means_df.transpose()
    
    # Reset index to turn the File names into a column
    combined_means_df = combined_means_df.reset_index().rename(columns={'index': 'File'})
    
    # Melt the DataFrame to long format for seaborn
    means_long = combined_means_df.melt(id_vars=['File'], var_name='Header', value_name='Mean Value')
    
    # Optional: Sort headers for better visualization
    means_long = means_long.sort_values('Header')
    
    # Plotting the mean values
    plt.figure(figsize=(20, 10))
    sns.barplot(x='Header', y='Mean Value', hue='File', data=means_long)
    
    # Rotate x-axis labels for better readability
    plt.xticks(rotation=90)
    
    # Set plot titles and labels
    plt.title('Comparison of Mean Values Across Frameworks', fontsize=16)
    plt.xlabel('Headers', fontsize=14)
    plt.ylabel('Mean Value', fontsize=14)
    
    # Adjust layout to prevent clipping
    plt.tight_layout()
    
    # Save the plot as an image file
    plot_filename = 'comparison_mean_values.png'
    plt.savefig(plot_filename)
    print(f"Saved plot '{plot_filename}'.")
    
    # Show the plot
    plt.show()

if __name__ == "__main__":
    main()

