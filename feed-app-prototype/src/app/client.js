export async function getPoll(id){
  try{
    const response = await fetch(`http://localhost:8080/api/polls/${id}`,{
      method: 'GET',
    });

    if (!response.ok){
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    if (response.status ===204){
      return []
    }

    const data = await response.json();
    console.log(data);
    return data;
  } catch (error){
    console.error('Failed to fetch poll', error);
    return [];
  }
}

export async function getPolls(){
  try {
    const response = await fetch('http://localhost:8080/api/polls',{
      method: 'GET',
    });
    if (response.status === 204){
      return [];
    }

    return await response.json();
  } catch (error){
    console.error('Failed to fetch polls', error);
    return [];
  }
}
