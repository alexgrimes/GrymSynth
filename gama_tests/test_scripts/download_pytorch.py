import requests
import os
import sys
import time

def download_file(url, destination):
    """
    Download a file with progress reporting and auto-retry
    """
    print(f"Downloading {url} to {destination}")
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(destination), exist_ok=True)
    
    # Check if file already exists (for resuming)
    if os.path.exists(destination):
        first_byte = os.path.getsize(destination)
        headers = {'Range': f'bytes={first_byte}-'}
        mode = 'ab'
        print(f"Resuming download from byte {first_byte}")
    else:
        first_byte = 0
        headers = {}
        mode = 'wb'
    
    # Start download with retry logic
    max_retries = 5
    retry_count = 0
    chunk_size = 1024 * 1024  # 1MB chunks
    
    while retry_count < max_retries:
        try:
            response = requests.get(url, headers=headers, stream=True, timeout=30)
            
            if first_byte > 0 and response.status_code == 206:
                total_size = int(response.headers.get('content-length', 0)) + first_byte
            else:
                total_size = int(response.headers.get('content-length', 0))
                first_byte = 0
            
            print(f"Total file size: {total_size / (1024*1024):.2f} MB")
            
            downloaded = first_byte
            start_time = time.time()
            
            with open(destination, mode) as f:
                for chunk in response.iter_content(chunk_size=chunk_size):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        
                        # Calculate progress and speed
                        percent = downloaded / total_size * 100
                        elapsed_time = time.time() - start_time
                        speed = downloaded / (1024*1024) / elapsed_time if elapsed_time > 0 else 0
                        
                        # Update progress bar
                        sys.stdout.write(f"\rProgress: {percent:.1f}% | {downloaded/(1024*1024):.1f}/{total_size/(1024*1024):.1f} MB | {speed:.2f} MB/s")
                        sys.stdout.flush()
            
            print("\nDownload complete!")
            return True
            
        except (requests.exceptions.RequestException, ConnectionError, TimeoutError) as e:
            retry_count += 1
            print(f"\nError: {e}. Retrying ({retry_count}/{max_retries})...")
            time.sleep(2)
    
    print("Maximum retries reached. Download failed.")
    return False

# URLs for PyTorch 1.13.1 with CUDA 11.6
urls = {
    "torch": "https://download.pytorch.org/whl/cu116/torch-1.13.1%2Bcu116-cp39-cp39-win_amd64.whl",
    "torchvision": "https://download.pytorch.org/whl/cu116/torchvision-0.14.1%2Bcu116-cp39-cp39-win_amd64.whl",
    "torchaudio": "https://download.pytorch.org/whl/cu116/torchaudio-0.13.1%2Bcu116-cp39-cp39-win_amd64.whl"
}

# Download directory
download_dir = "./pytorch_wheels"

def main():
    # Create download directory if it doesn't exist
    os.makedirs(download_dir, exist_ok=True)
    
    # Download each package
    for name, url in urls.items():
        destination = os.path.join(download_dir, os.path.basename(url))
        if download_file(url, destination):
            print(f"Successfully downloaded {name}")
        else:
            print(f"Failed to download {name}")
            sys.exit(1)

    print("\nAll downloads completed successfully!")
    print("\nTo install the downloaded packages, run:")
    print(f"pip install {os.path.join(download_dir, '*.whl')}")

if __name__ == "__main__":
    main()