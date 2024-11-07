import React, { useState, useEffect } from 'react';

export async function getPolls() {
  try {
    const response = await fetch('http://localhost:8080/api/polls', {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    //No content
    if (response.status == 204) {
      return []
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to fetch polls', error)
    return []
  }
}


export default function HelloWorld() {
    const [polls, setPolls] = useState([]);

    useEffect(() => {
        const fetchPolls = async () => {
            try {
                const data = await getPolls();
                setPolls(Array.isArray(data) ? data : []); // Ensure data is an array
            } catch (error) {
                console.error('Failed to fetch polls:', error);
                setPolls([]); // Set polls to an empty array if there is an error
            }
        };

        fetchPolls();
    }, []);

    return (
        <>
            <ul>
                {polls.map((poll, index) => (
                    <li key={index}>
                        {poll.question}
                        <ul>
                            {poll.voteOptions?.map((option, optionIndex) => (
                                <li key={optionIndex}>{option.caption}</li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </>
    );
}

